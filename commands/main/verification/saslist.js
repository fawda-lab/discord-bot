const { EmbedBuilder } = require('discord.js');
const Member = require('../../../utils/models/Member');
const { ft, errEmbed } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'saslist',
    execute: async (msg, args, client) => {
        const sasList = await Member.find({ 'sas.active': true }).select('_id sas');
        if (!sasList.length) return msg.reply({ embeds: [errEmbed('Sas list is empty.')] });
        const e = new EmbedBuilder()
            .setTitle('📋  Sas List')
            .setColor(C.WARN)
            .setDescription(sasList.map((u, i) => {
                const by = u.sas?.by ? ` — added by <@${u.sas.by}>` : '';
                return `**${i + 1}.** <@${u._id}>${by}`;
            }).join('\n'))
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
