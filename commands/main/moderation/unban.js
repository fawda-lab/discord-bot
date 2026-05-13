const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasStaffPerms } = require('../../../utils/mainHelpers');
const { C, LOG_CHANNELS } = require('../../../utils/mainConstants');

module.exports = {
    name: 'unban',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const userId = args[0]?.replace(/[<@!>]/g, '');
        if (!userId) return msg.reply({ embeds: [errEmbed('Usage: `!unban [userID] [reason]`')] });
        const reason = args.slice(1).join(' ') || 'No reason provided';

        const ban = await guild.bans.fetch(userId).catch(() => null);
        if (!ban) return msg.reply({ embeds: [errEmbed('That user is not banned.')] });

        await guild.members.unban(userId, reason);

        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('✅  Member Unbanned')
            .setColor(C.VERIF)
            .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 User',   value: `${ban.user.tag} (${userId})`, inline: true  },
                { name: '🛡️ By',    value: `${member}`,                    inline: true  },
                { name: '📝 Reason', value: reason,                         inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        await msg.reply({ embeds: [e] });
        const logCh = await guild.channels.fetch(LOG_CHANNELS.UNBAN).catch(() => null);
        if (logCh) await logCh.send({ embeds: [e] }).catch(e => log.error('[UnbanLog]', e.message));
    },
};
