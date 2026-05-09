const { EmbedBuilder } = require('discord.js');
const Member = require('../../../utils/models/Member');
const { ft, rankMedal } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'lbj',
    execute: async (msg, args, client) => {
        const top = await Member.find({ 'staffStats.jailsDone': { $gt: 0 } })
            .sort({ 'staffStats.jailsDone': -1 }).limit(10);
        const lines = top.map((u, i) => `${rankMedal(i)} <@${u._id}> — **${u.staffStats.jailsDone}** jails`);
        const e = new EmbedBuilder()
            .setTitle('🏆  Top 10 — Jailers')
            .setColor(C.GOLD)
            .setDescription(lines.join('\n') || 'No data yet.')
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
