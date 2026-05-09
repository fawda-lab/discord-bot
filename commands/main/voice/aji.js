const { EmbedBuilder } = require('discord.js');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'aji',
    cooldown: 60,
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const chId = args[1]?.replace(/[<#>]/g, '');
        const vc   = chId ? guild.channels.cache.get(chId) : member.voice?.channel;
        if (!vc) return msg.reply({ embeds: [errEmbed(chId ? 'Channel not found.' : 'You are not in a voice channel.')] });
        if (!target.voice?.channel) return msg.reply({ embeds: [errEmbed(`${target} is not in a voice channel.`)] });
        await target.voice.setChannel(vc);
        const e = new EmbedBuilder().setColor(C.VOICE)
            .setDescription(`🔊  ${target} moved to **${vc.name}**.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
