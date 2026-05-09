const { EmbedBuilder } = require('discord.js');
const Member = require('../../utils/models/Member');
const { calcLevel } = require('../../utils/dataManager');

module.exports = {
    name: 'lb',
    execute: async (msg) => {
        const top = await Member.find({ xp: { $gt: 0 } }).sort({ xp: -1 }).limit(10);
        const medals = ['🥇','🥈','🥉'];
        const lines  = top.map((u, i) => {
            const info = calcLevel(u.xp);
            return `${medals[i] ?? `**${i+1}.**`} <@${u._id}> — Lv.**${info.level}** · \`${u.xp.toLocaleString()} XP\``;
        });
        const e = new EmbedBuilder()
            .setTitle('🏆  FAWDA — XP Leaderboard')
            .setColor(0xFFD700)
            .setDescription(lines.join('\n') || 'No data yet.')
            .setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
