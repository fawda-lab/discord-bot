const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { canModerate } = require('../../../utils/permissions');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C, LOG_CHANNELS } = require('../../../utils/mainConstants');

module.exports = {
    name: 'ban',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        if (!canModerate(member, target))
            return msg.reply({ embeds: [errEmbed('You cannot moderate someone with an equal or higher role.')] });
        const reason = args.slice(1).join(' ') || 'No reason provided';

        await target.send(`🔨 You have been **banned** from **${guild.name}**.\n📝 Reason: ${reason}`)
            .catch(e => log.debug('[DEBUG]', e.message));
        await guild.members.ban(target, { reason });

        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('🔨  Member Banned')
            .setColor(C.JAIL)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target.user.tag} (${target.id})`, inline: true  },
                { name: '🛡️ By',    value: `${member}`,                          inline: true  },
                { name: '📝 Reason', value: reason,                               inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        await msg.reply({ embeds: [e] });
        const logCh = await guild.channels.fetch(LOG_CHANNELS.BAN).catch(() => null);
        if (logCh) await logCh.send({ embeds: [e] }).catch(e => log.error('[BanLog]', e.message));
    },
};
