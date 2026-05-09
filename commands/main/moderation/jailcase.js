const { EmbedBuilder } = require('discord.js');
const { getMember } = require('../../../utils/mainData');
const { ft, errEmbed, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'jailcase',
    execute: async (msg, args, client) => {
        const { guild } = msg;
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });

        const doc = await getMember(target.id);
        if (!doc.jail) return msg.reply({ embeds: [errEmbed('That member is not jailed.')] });

        const e = new EmbedBuilder()
            .setTitle(`📁  Jail Case — ${target.displayName}`)
            .setColor(C.JAIL)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📝 Reason',     value: doc.jail.reason,                                                                           inline: false },
                { name: '🛡️ Jailed By', value: `<@${doc.jail.jailedBy}>`,                                                                 inline: true  },
                { name: '🕐 Since',      value: `<t:${Math.floor(new Date(doc.jail.timestamp).getTime() / 1000)}:R>`,                       inline: true  },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
