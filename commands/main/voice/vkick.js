const { EmbedBuilder } = require('discord.js');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'vkick',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        if (!target.voice?.channel) return msg.reply({ embeds: [errEmbed(`${target} is not in a voice channel.`)] });
        await target.voice.setChannel(null);
        const e = new EmbedBuilder().setColor(C.JAIL)
            .setDescription(`🚫  ${target} was kicked from voice.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
