const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { ft, errEmbed } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'caty',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!member.permissions.has(PermissionFlagsBits.Administrator))
            return msg.reply({ embeds: [errEmbed('No permission.')] });
        const name = args.join(' ');
        if (!name) return msg.reply({ embeds: [errEmbed('Usage: `!caty [name]`')] });
        const category = await guild.channels.create({ name, type: ChannelType.GuildCategory });
        const e = new EmbedBuilder().setColor(C.VERIF)
            .setDescription(`✅  Category **${category.name}** created.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
