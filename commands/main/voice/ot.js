const { EmbedBuilder } = require('discord.js');
const { ft, errEmbed } = require('../../../utils/mainHelpers');
const { C, ONE_TAP_1 } = require('../../../utils/mainConstants');

module.exports = {
    name: 'ot',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!member.voice?.channel) return msg.reply({ embeds: [errEmbed('You are not in a voice channel.')] });
        const vc = guild.channels.cache.get(ONE_TAP_1);
        if (!vc) return msg.reply({ embeds: [errEmbed('One Tap 1 not found.')] });
        await member.voice.setChannel(vc);
        const e = new EmbedBuilder().setColor(C.VOICE)
            .setDescription(`🔊  ${member} moved to **One Tap 1**.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
