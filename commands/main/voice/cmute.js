const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { canModerate } = require('../../../utils/permissions');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C, LOG_CHANNELS } = require('../../../utils/mainConstants');
const { updateMember } = require('../../../utils/mainData');

module.exports = {
    name: 'cmute',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        if (!canModerate(member, target))
            return msg.reply({ embeds: [errEmbed('You cannot moderate someone with an equal or higher role.')] });
        const timeArg = args[1];
        if (!timeArg) return msg.reply({ embeds: [errEmbed('Usage: `!cmute @user [time]` — e.g. `5m` `10m`')] });
        const match = timeArg.match(/^(\d+)m?$/i);
        if (!match) return msg.reply({ embeds: [errEmbed('Invalid duration. Use minutes, e.g. `5m`')] });
        const ms = parseInt(match[1]) * 60_000;
        if (ms > 28 * 86_400_000) return msg.reply({ embeds: [errEmbed('Maximum: 28 days.')] });
        const reason = args.slice(2).join(' ') || 'No reason provided';

        await target.timeout(ms, reason);
        await updateMember(target.id, {
            $push: { timeouts: { reason, by: member.id, at: new Date().toISOString(), duration: timeArg } },
        });

        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('🔇  Chat Mute')
            .setColor(C.TIMEOUT)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member',   value: `${target}`, inline: true  },
                { name: '⏱️ Duration', value: timeArg,     inline: true  },
                { name: '🛡️ By',      value: `${member}`, inline: true  },
                { name: '📝 Reason',  value: reason,       inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        await msg.reply({ embeds: [e] });
        await target.send(`🔇 You have been **chat muted** in **${guild.name}** for **${timeArg}**.\n📝 Reason: ${reason}`)
            .catch(e => log.debug('[DEBUG]', e.message));
        const logCh = await guild.channels.fetch(LOG_CHANNELS.TIMEOUT).catch(() => null);
        if (logCh) await logCh.send({ embeds: [e] }).catch(e => log.error('[CmuteLog]', e.message));
    },
};
