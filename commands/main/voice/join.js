const { EmbedBuilder } = require('discord.js');
const { ft, errEmbed } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'join',
    execute: async (msg, args, client) => {
        const { member } = msg;
        if (!member.voice?.channel) return msg.reply({ embeds: [errEmbed('You are not in a voice channel.')] });
        const e = new EmbedBuilder().setColor(C.VOICE)
            .setDescription(`🔊  Joined **${member.voice.channel.name}**.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
