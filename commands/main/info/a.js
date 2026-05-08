const { EmbedBuilder } = require('discord.js');
const { ft, errEmbed, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'a',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        const target = args[0] ? await resolveUser(guild, args[0]) : member;
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const e = new EmbedBuilder()
            .setTitle(`🖼️  ${target.displayName}'s Avatar`)
            .setImage(target.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor(C.INFO)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
