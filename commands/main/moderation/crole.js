const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { ft, errEmbed } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'crole',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!member.permissions.has(PermissionFlagsBits.Administrator))
            return msg.reply({ embeds: [errEmbed('No permission.')] });
        const name = args.join(' ');
        if (!name) return msg.reply({ embeds: [errEmbed('Usage: `!crole [name]`')] });
        const role = await guild.roles.create({ name });
        const e = new EmbedBuilder().setColor(C.VERIF)
            .setDescription(`✅  Role **${role.name}** created (${role}).`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
