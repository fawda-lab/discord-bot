const { EmbedBuilder } = require('discord.js');
const { loadData } = require('../../../utils/mainData');
const { ft, errEmbed } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'saslist',
    execute: async (msg, args, client) => {
        const data = loadData();
        if (!data.sasList.length) return msg.reply({ embeds: [errEmbed('Sas list is empty.')] });
        const e = new EmbedBuilder()
            .setTitle('📋  Sas List')
            .setColor(C.WARN)
            .setDescription(data.sasList.map((id, i) => `**${i + 1}.** <@${id}>`).join('\n'))
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
