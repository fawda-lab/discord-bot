const { EmbedBuilder } = require('discord.js');
const { loadData } = require('../../../utils/mainData');
const { ft, errEmbed, warnBar, warnColor, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'warns',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        const target   = args[0] ? await resolveUser(guild, args[0]) : member;
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const data     = loadData();
        const warnData = data.warns[target.id];
        if (!warnData || warnData.count === 0) {
            return msg.reply({ embeds: [new EmbedBuilder().setColor(C.VERIF)
                .setDescription(`✅  ${target} has **no warns**.`)
                .setFooter(ft(client))] });
        }
        const e = new EmbedBuilder()
            .setTitle(`📋  Warns — ${target.displayName}`)
            .setColor(warnColor(warnData.count))
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`${warnBar(warnData.count)}  **${warnData.count}/3 warns**`);
        warnData.reasons.forEach((w, i) => {
            e.addFields({ name: `Warn #${i + 1}`, value: `${w.reason}\n— by <@${w.by}> • <t:${Math.floor(new Date(w.at).getTime()/1000)}:R>`, inline: false });
        });
        e.setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
