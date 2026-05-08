const { EmbedBuilder } = require('discord.js');
const { loadData, calcLevel } = require('../../utils/dataManager');

module.exports = {
    name: 'lb',
    execute: async (msg, args, client) => {
        const data   = loadData();
        const sorted = Object.entries(data.users).sort(([,a],[,b]) => b.xp - a.xp).slice(0, 10);
        const medals = ['🥇','🥈','🥉'];
        const lines  = sorted.map(([id, u], i) => {
            const info = calcLevel(u.xp);
            return `${medals[i] ?? `**${i+1}.**`} <@${id}> — Lv.**${info.level}** · \`${u.xp.toLocaleString()} XP\``;
        });
        const e = new EmbedBuilder()
            .setTitle('🏆  FAWDA — XP Leaderboard')
            .setColor(0xFFD700)
            .setDescription(lines.join('\n') || 'No data yet.')
            .setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
