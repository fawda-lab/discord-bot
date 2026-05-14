const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasEventOrModeratorPerms } = require('../../../utils/mainHelpers');
const { C, LOG_CHANNELS } = require('../../../utils/mainConstants');

const UNIT_MAP = { s: 1000, m: 60_000, h: 3_600_000 };
const MAX_TIMEOUT_MS = 2_147_483_647;

function parseDurationAndReason(args) {
    if (!args.length) return { ms: null, duration: 'Until manually unmuted', reason: 'No reason provided' };

    const match = args[0].match(/^(\d+)(s|m|h)$/i);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (!Number.isSafeInteger(amount) || amount <= 0) return null;

    const ms = amount * UNIT_MAP[unit];
    if (ms > MAX_TIMEOUT_MS) {
        return { error: 'Duration is too long. Maximum is about 24 days.' };
    }

    return {
        ms,
        duration: `${amount}${unit}`,
        reason: args.slice(1).join(' ') || 'No reason provided',
    };
}

function canBotMute(botMember, target) {
    if (target.id === target.guild.ownerId) return false;
    return botMember.roles.highest.position > target.roles.highest.position;
}

function fieldValue(value) {
    return value.length > 1024 ? `${value.slice(0, 1021)}...` : value;
}

function buildUsageEmbed() {
    return errEmbed('Usage: `!vmuteall`, `!vmuteall 30s [reason]`, `!vmuteall 10m [reason]`, `!vmuteall 1h [reason]`');
}

module.exports = {
    name: 'vmuteall',
    aliases: ['muteall'],
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasEventOrModeratorPerms(member)) {
            return msg.reply({ embeds: [errEmbed('No permission. Event Hoster, Event Manager, or Moderator+ only.')] });
        }

        const voiceChannel = member.voice?.channel;
        if (!voiceChannel) return msg.reply({ embeds: [errEmbed('You are not in a voice channel.')] });

        const parsed = parseDurationAndReason(args);
        if (!parsed) return msg.reply({ embeds: [buildUsageEmbed()] });
        if (parsed.error) return msg.reply({ embeds: [errEmbed(parsed.error)] });

        const botMember = guild.members.me ?? await guild.members.fetchMe();
        const permissions = voiceChannel.permissionsFor(botMember);
        if (!permissions?.has(PermissionFlagsBits.MuteMembers)) {
            return msg.reply({ embeds: [errEmbed(`I am missing Mute Members permission in **${voiceChannel.name}**.`)] });
        }

        const muted = [];
        const skipped = [];
        const auditReason = `vmuteall by ${member.user.tag}: ${parsed.reason}`.slice(0, 512);

        for (const target of voiceChannel.members.values()) {
            if (target.id === member.id) {
                skipped.push(target);
                continue;
            }
            if (target.user.bot || target.voice.serverMute || !canBotMute(botMember, target)) {
                skipped.push(target);
                continue;
            }

            try {
                await target.voice.setMute(true, auditReason);
                muted.push(target);
            } catch (error) {
                skipped.push(target);
                log.error(`[VmuteAll] Failed to mute ${target.user.tag} (${target.id})`, error);
            }
        }

        if (!muted.length) {
            return msg.reply({ embeds: [errEmbed('No users were muted. Everyone was already muted, excluded, or above my role.')] });
        }

        const e = new EmbedBuilder()
            .setTitle('Voice Mute All')
            .setColor(C.MUTED)
            .addFields(
                { name: 'Channel', value: voiceChannel.name, inline: true },
                { name: 'Muted Users', value: `${muted.length}`, inline: true },
                { name: 'Duration', value: parsed.duration, inline: true },
                { name: 'Reason', value: fieldValue(parsed.reason), inline: false },
            )
            .setFooter(ft(client))
            .setTimestamp();
        await msg.reply({ embeds: [e] });

        const logEmbed = new EmbedBuilder()
            .setTitle('Voice Mute All')
            .setColor(C.MUTED)
            .addFields(
                { name: 'By', value: `${member}`, inline: true },
                { name: 'Channel', value: voiceChannel.name, inline: true },
                { name: 'Muted', value: `${muted.length}`, inline: true },
                { name: 'Skipped', value: `${skipped.length}`, inline: true },
                { name: 'Duration', value: parsed.duration, inline: true },
                { name: 'Reason', value: fieldValue(parsed.reason), inline: false },
            )
            .setTimestamp();
        const logCh = await guild.channels.fetch(LOG_CHANNELS.MOVE).catch(() => null);
        if (logCh) await logCh.send({ embeds: [logEmbed] }).catch(e => log.error('[VmuteAllLog]', e.message));

        if (parsed.ms) {
            const mutedIds = muted.map(target => target.id);
            setTimeout(async () => {
                for (const targetId of mutedIds) {
                    const target = await guild.members.fetch(targetId).catch(() => null);
                    if (!target?.voice?.serverMute) continue;
                    await target.voice.setMute(false, 'vmuteall expired').catch(e => log.debug('[DEBUG]', e.message));
                }
            }, parsed.ms);
        }
    },
};
