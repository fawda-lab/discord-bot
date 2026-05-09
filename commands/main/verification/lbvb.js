const { EmbedBuilder } = require('discord.js');
const Member = require('../../../utils/models/Member');
const { ft, rankMedal } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'lbvb',
    execute: async (msg, args, client) => {
        const top = await Member.find({ 'staffStats.verificationsDone': { $gt: 0 } })
            .sort({ 'staffStats.verificationsDone': -1 }).limit(10);
        const lines = top.map((u, i) => `${rankMedal(i)} <@${u._id}> — **${u.staffStats.verificationsDone}** verifications`);
        const e = new EmbedBuilder()
            .setTitle('🏆  Top 10 — Verification Staff')
            .setColor(C.GOLD)
            .setDescription(lines.join('\n') || 'No data yet.')
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
