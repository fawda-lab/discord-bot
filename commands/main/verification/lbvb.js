const { EmbedBuilder } = require('discord.js');
const { loadData } = require('../../../utils/mainData');
const { ft, rankMedal } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'lbvb',
    execute: async (msg, args, client) => {
        const data   = loadData();
        const sorted = Object.entries(data.verifications).sort(([,a],[,b]) => b - a).slice(0, 10);
        const lines  = sorted.map(([uid, n], i) => `${rankMedal(i)} <@${uid}> — **${n}** verifications`);
        const e = new EmbedBuilder()
            .setTitle('🏆  Top 10 — Verification Staff')
            .setColor(C.GOLD)
            .setDescription(lines.join('\n') || 'No data yet.')
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
