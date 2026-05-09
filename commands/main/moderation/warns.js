const { EmbedBuilder } = require('discord.js');
const { getMember } = require('../../../utils/mainData');
const { ft, errEmbed, warnBar, warnColor, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'warns',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        const target = args[0] ? await resolveUser(guild, args[0]) : member;
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });

        const doc = await getMember(target.id);
        if (!doc.warns.length) {
            return msg.reply({ embeds: [new EmbedBuilder().setColor(C.VERIF)
                .setDescription(`✅  ${target} has **no warns**.`)
                .setFooter(ft(client))] });
        }

        const e = new EmbedBuilder()
            .setTitle(`📋  Warns — ${target.displayName}`)
            .setColor(warnColor(doc.warns.length))
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`${warnBar(doc.warns.length)}  **${doc.warns.length}/3 warns**`);
        doc.warns.forEach((w, i) => {
            e.addFields({ name: `Warn #${i + 1}`, value: `${w.reason}\n— by <@${w.by}> • <t:${Math.floor(new Date(w.at).getTime()/1000)}:R>`, inline: false });
        });
        e.setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
