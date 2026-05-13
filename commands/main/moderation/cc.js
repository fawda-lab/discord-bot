const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { ft, errEmbed } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'cc',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!member.permissions.has(PermissionFlagsBits.Administrator))
            return msg.reply({ embeds: [errEmbed('No permission.')] });
        const categoryId   = args[0];
        const channelName  = args.slice(1).join('-').toLowerCase();
        if (!categoryId || !channelName)
            return msg.reply({ embeds: [errEmbed('Usage: `!cc [category_id] [channel_name]`')] });
        const category = guild.channels.cache.get(categoryId);
        if (!category || category.type !== ChannelType.GuildCategory)
            return msg.reply({ embeds: [errEmbed('Category not found.')] });
        const channel = await guild.channels.create({ name: channelName, type: ChannelType.GuildText, parent: categoryId });
        const e = new EmbedBuilder().setColor(C.VERIF)
            .setDescription(`✅  Channel ${channel} created under **${category.name}**.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
