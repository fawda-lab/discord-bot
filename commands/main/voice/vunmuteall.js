const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasEventOrModeratorPerms } = require('../../../utils/mainHelpers');
const { C, LOG_CHANNELS } = require('../../../utils/mainConstants');

function canBotMute(botMember, target) {
    if (target.id === target.guild.ownerId) return false;
    return botMember.roles.highest.position > target.roles.highest.position;
}

function fieldValue(value) {
    return value.length > 1024 ? `${value.slice(0, 1021)}...` : value;
}

module.exports = {
    name: 'vunmuteall',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasEventOrModeratorPerms(member)) {
            return msg.reply({ embeds: [errEmbed('No permission. Event Hoster, Event Manager, or Moderator+ only.')] });
        }

        const voiceChannel = member.voice?.channel;
        if (!voiceChannel) return msg.reply({ embeds: [errEmbed('You are not in a voice channel.')] });

        const botMember = guild.members.me ?? await guild.members.fetchMe();
        const permissions = voiceChannel.permissionsFor(botMember);
        if (!permissions?.has(PermissionFlagsBits.MuteMembers)) {
            return msg.reply({ embeds: [errEmbed(`I am missing Mute Members permission in **${voiceChannel.name}**.`)] });
        }

        const reason = args.join(' ') || 'No reason provided';
        const auditReason = `vunmuteall by ${member.user.tag}: ${reason}`.slice(0, 512);
        const unmuted = [];
        const skipped = [];

        for (const target of voiceChannel.members.values()) {
            if (!target.voice.serverMute || !canBotMute(botMember, target)) {
                skipped.push(target);
                continue;
            }

            try {
                await target.voice.setMute(false, auditReason);
                unmuted.push(target);
            } catch (error) {
                skipped.push(target);
                log.error(`[VunmuteAll] Failed to unmute ${target.user.tag} (${target.id})`, error);
            }
        }

        if (!unmuted.length) {
            return msg.reply({ embeds: [errEmbed('No server-muted users were unmuted in your voice channel.')] });
        }

        const e = new EmbedBuilder()
            .setTitle('Voice Unmute All')
            .setColor(C.VOICE)
            .addFields(
                { name: 'Channel', value: voiceChannel.name, inline: true },
                { name: 'Unmuted Users', value: `${unmuted.length}`, inline: true },
                { name: 'Reason', value: fieldValue(reason), inline: false },
            )
            .setFooter(ft(client))
            .setTimestamp();
        await msg.reply({ embeds: [e] });

        const logEmbed = new EmbedBuilder()
            .setTitle('Voice Unmute All')
            .setColor(C.VOICE)
            .addFields(
                { name: 'By', value: `${member}`, inline: true },
                { name: 'Channel', value: voiceChannel.name, inline: true },
                { name: 'Unmuted', value: `${unmuted.length}`, inline: true },
                { name: 'Skipped', value: `${skipped.length}`, inline: true },
                { name: 'Reason', value: fieldValue(reason), inline: false },
            )
            .setTimestamp();
        const logCh = await guild.channels.fetch(LOG_CHANNELS.MOVE).catch(() => null);
        if (logCh) await logCh.send({ embeds: [logEmbed] }).catch(e => log.error('[VunmuteAllLog]', e.message));
    },
};
