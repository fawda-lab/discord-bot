const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const {
    joinVoiceChannel,
    entersState,
    getVoiceConnection,
    VoiceConnectionStatus,
} = require('@discordjs/voice');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasStaffPerms } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

const REQUIRED_PERMISSIONS = [
    { flag: PermissionFlagsBits.ViewChannel, name: 'View Channel' },
    { flag: PermissionFlagsBits.Connect, name: 'Connect' },
    { flag: PermissionFlagsBits.Speak, name: 'Speak' },
    { flag: PermissionFlagsBits.UseVAD, name: 'Use Voice Activity' },
];

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
            if (existingConnection) existingConnection.destroy();

            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });

            await entersState(connection, VoiceConnectionStatus.Ready, 15000);

            const e = new EmbedBuilder().setColor(C.VOICE)
                .setDescription(`Joined **${voiceChannel.name}**.`)
                .setFooter(ft(client));
            return msg.reply({ embeds: [e] });
        } catch (error) {
            if (connection) {
                try { connection.destroy(); } catch (destroyError) { log.debug('[DEBUG]', destroyError.message); }
            }
            log.error(
                `[JoinVoice] guild=${guild.name} (${guild.id}) user=${msg.author.tag} (${msg.author.id}) ` +
                `channel=${voiceChannel.name} (${voiceChannel.id})\n` +
                (error.stack ?? error)
            );

            const message = error?.message ? `Failed to join voice: ${error.message}` : 'Failed to join voice.';
            return msg.reply({ embeds: [errEmbed(message)] }).catch(e => log.debug('[DEBUG]', e.message));
        }
    },
};
