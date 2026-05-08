const { EmbedBuilder } = require('discord.js');
const { ft, errEmbed, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'b',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        const target    = args[0] ? await resolveUser(guild, args[0]) : member;
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const user      = await client.users.fetch(target.id, { force: true });
        const bannerUrl = user.bannerURL({ dynamic: true, size: 1024 });
        if (!bannerUrl) return msg.reply({ embeds: [errEmbed(`${target} has no banner.`)] });
        const e = new EmbedBuilder()
            .setTitle(`🖼️  ${target.displayName}'s Banner`)
            .setImage(bannerUrl)
            .setColor(C.INFO)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
