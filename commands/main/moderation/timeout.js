const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { canModerate } = require('../../../utils/permissions');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

const UNIT_MAP = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

module.exports = {
    name: 'timeout',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target  = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        if (!canModerate(member, target)) return msg.reply({ embeds: [errEmbed('You cannot moderate someone with an equal or higher role.')] });
        const timeArg = args[1];
        if (!timeArg) return msg.reply({ embeds: [errEmbed('Usage: `+timeout @user [durée] [raison]`\nExemple: `+timeout @user 10m spam`')] });
        const match = timeArg.match(/^(\d+)(s|m|h|d)?$/i);
        if (!match) return msg.reply({ embeds: [errEmbed('Durée invalide. Ex: `30s` `10m` `1h` `1d`')] });
        const ms = parseInt(match[1]) * UNIT_MAP[(match[2] || 'm').toLowerCase()];
        if (ms > 28 * 86_400_000) return msg.reply({ embeds: [errEmbed('Maximum: 28 jours.')] });
        const reason = args.slice(2).join(' ') || 'No reason provided';
        await target.timeout(ms, reason);
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('⏱️  Timeout')
            .setColor(C.TIMEOUT)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`, inline: true  },
                { name: '⏱️ Durée',  value: timeArg,     inline: true  },
                { name: '🛡️ By',    value: `${member}`,  inline: true  },
                { name: '📝 Reason', value: reason,       inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        await msg.reply({ embeds: [e] });
        await target.send(`⏱️ You have been **timed out** in **${guild.name}** for **${timeArg}**.\n📝 Reason: ${reason}`)
            .catch(e => log.debug('[DEBUG]', e.message));
    },
};
