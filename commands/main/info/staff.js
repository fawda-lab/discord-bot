const { EmbedBuilder } = require('discord.js');
const { loadData } = require('../../../utils/mainData');
const { ft, errEmbed, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'staff',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        const target    = args[0] ? await resolveUser(guild, args[0]) : member;
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const data      = loadData();
        const verifDone = data.verifications[target.id] || 0;
        const jailsDone = data.jailActions[target.id]   || 0;
        const roles     = target.roles.cache
            .filter(r => r.id !== guild.roles.everyone.id)
            .sort((a, b) => b.position - a.position)
            .map(r => r.toString()).slice(0, 8).join(' ') || 'None';
        const e = new EmbedBuilder()
            .setTitle(`🛡️  Staff Info — ${target.displayName}`)
            .setColor(C.GOLD)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '✅ Verifications', value: `\`${verifDone}\``, inline: true  },
                { name: '🔒 Jails Done',   value: `\`${jailsDone}\``, inline: true  },
                { name: '📅 Joined',       value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: false },
                { name: '🏷️ Roles',        value: roles,              inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
