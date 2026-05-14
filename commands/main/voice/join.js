const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const {
    joinVoiceChannel,
    entersState,
    getVoiceConnection,
    VoiceConnectionStatus,
} = require('@discordjs/voice');
const { inspect } = require('node:util');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasStaffPerms } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

const READY_TIMEOUT_MS = 45000;
const REQUIRED_PERMISSIONS = [
    { flag: PermissionFlagsBits.ViewChannel, name: 'View Channel' },
    { flag: PermissionFlagsBits.Connect, name: 'Connect' },
    { flag: PermissionFlagsBits.Speak, name: 'Speak' },
    { flag: PermissionFlagsBits.UseVAD, name: 'Use Voice Activity' },
];

function attachVoiceDebugging(connection, guild) {
    if (connection.__fawdaJoinDebugAttached) return;
    Object.defineProperty(connection, '__fawdaJoinDebugAttached', {
        value: true,
        enumerable: false,
    });

    connection.on('stateChange', (oldState, newState) => {
        log.info(`[JoinVoiceState] guild=${guild.name} (${guild.id}) ${oldState.status} -> ${newState.status}`);
    });

    connection.on('error', error => {
        log.error(`[JoinVoiceConnectionError] guild=${guild.name} (${guild.id})`, error);
    });

    connection.on('debug', message => {
        log.debug(`[JoinVoiceDebug] guild=${guild.name} (${guild.id}) ${message}`);
    });
}

function getConnectionSummary(connection) {
    if (!connection) return 'connection=null';
    const state = connection.state;
    const summary = {
        status: state?.status,
        reason: state?.reason,
        closeCode: state?.closeCode,
        rejoinAttempts: connection.rejoinAttempts,
        joinConfig: connection.joinConfig,
    };
    return inspect(summary, { depth: 4, breakLength: 120 });
}

async function isBotVisibleInChannel(guild, channelId) {
    const botMember = guild.members.me ?? await guild.members.fetchMe().catch(() => null);
    const botVoiceState = botMember ? guild.voiceStates.cache.get(botMember.id) : null;
    return botMember?.voice?.channelId === channelId || botVoiceState?.channelId === channelId;
}

function shouldDestroyFailedConnection(connection) {
    return connection?.state?.status === VoiceConnectionStatus.Disconnected;
}

module.exports = {
    name: 'join',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });

        const voiceChannel = member.voice?.channel;
        if (!voiceChannel) return msg.reply({ embeds: [errEmbed('You are not in a voice channel.')] });

        let connection;
        try {
            const botMember = guild.members.me ?? await guild.members.fetchMe();
            const permissions = voiceChannel.permissionsFor(botMember);
            if (!permissions) {
                return msg.reply({ embeds: [errEmbed(`I cannot read permissions for **${voiceChannel.name}**.`)] });
            }

            const missing = REQUIRED_PERMISSIONS
                .filter(permission => !permissions.has(permission.flag))
                .map(permission => permission.name);

            if (missing.length) {
                return msg.reply({
                    embeds: [errEmbed(`I am missing these permissions in **${voiceChannel.name}**: ${missing.join(', ')}.`)],
                });
            }

            const existingConnection = getVoiceConnection(guild.id);
            if (existingConnection && existingConnection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection = existingConnection;
                attachVoiceDebugging(connection, guild);
                const alreadyInTarget = connection.joinConfig.channelId === voiceChannel.id || botMember.voice?.channelId === voiceChannel.id;
                if (!alreadyInTarget || connection.state.status !== VoiceConnectionStatus.Ready) {
                    const rejoined = connection.rejoin({
                        channelId: voiceChannel.id,
                        selfDeaf: false,
                        selfMute: false,
                    });
                    if (!rejoined) throw new Error('Existing voice connection could not rejoin the target channel.');
                }
            } else {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: false,
                    debug: true,
                });
                attachVoiceDebugging(connection, guild);
            }

            if (connection.state.status !== VoiceConnectionStatus.Ready) {
                await entersState(connection, VoiceConnectionStatus.Ready, READY_TIMEOUT_MS);
            }

            const e = new EmbedBuilder().setColor(C.VOICE)
                .setDescription(`Joined **${voiceChannel.name}**.`)
                .setFooter(ft(client));
            return msg.reply({ embeds: [e] });
        } catch (error) {
            const stateSummary = getConnectionSummary(connection);
            const fullState = inspect(connection?.state, { depth: 4, breakLength: 120 });
            log.error(
                `[JoinVoice] guild=${guild.name} (${guild.id}) user=${msg.author.tag} (${msg.author.id}) ` +
                `channel=${voiceChannel.name} (${voiceChannel.id})\n` +
                `Connection summary: ${stateSummary}\n` +
                `Connection full state: ${fullState}\n` +
                (error.stack ?? error)
            );

            if (await isBotVisibleInChannel(guild, voiceChannel.id)) {
                const state = connection?.state?.status ?? 'unknown';
                const e = new EmbedBuilder().setColor(C.VOICE)
                    .setDescription(`Joined **${voiceChannel.name}**. Voice readiness is still **${state}**, but I am connected.`)
                    .setFooter(ft(client));
                return msg.reply({ embeds: [e] }).catch(e => log.debug('[DEBUG]', e.message));
            }

            if (shouldDestroyFailedConnection(connection)) {
                try { connection.destroy(); } catch (destroyError) { log.debug('[DEBUG]', destroyError.message); }
            }

            const status = connection?.state?.status ?? 'unknown';
            const message = error?.message
                ? `Failed to join voice: ${error.message}. Current state: ${status}.`
                : `Failed to join voice. Current state: ${status}.`;
            return msg.reply({ embeds: [errEmbed(message)] }).catch(e => log.debug('[DEBUG]', e.message));
        }
    },
};
