const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Member = require('../../utils/models/Member');
const { calcLevel } = require('../../utils/dataManager');

const PAGE_SIZE = 10;
const MEDALS    = ['🥇', '🥈', '🥉'];

module.exports = {
    name: 'lb',
    execute: async (msg) => {
        const top = await Member.find({ xp: { $gt: 0 } }).sort({ xp: -1 }).limit(50);

        if (!top.length) {
            return msg.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('🏆  FAWDA — XP Leaderboard')
                    .setColor(0xFFD700)
                    .setDescription('No data yet.')
                    .setTimestamp()],
            });
        }

        const totalPages = Math.ceil(top.length / PAGE_SIZE);
        let page = 0;

        function buildEmbed(p) {
            const slice = top.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
            const lines = slice.map((u, i) => {
                const rank = p * PAGE_SIZE + i;
                const info = calcLevel(u.xp);
                return `${MEDALS[rank] ?? `**${rank + 1}.**`} <@${u._id}> — Lv.**${info.level}** · \`${u.xp.toLocaleString()} XP\``;
            });
            return new EmbedBuilder()
                .setTitle('🏆  FAWDA — XP Leaderboard')
                .setColor(0xFFD700)
                .setDescription(lines.join('\n'))
                .setFooter({ text: `Page ${p + 1}/${totalPages}` })
                .setTimestamp();
        }

        function buildRow(p, disabled = false) {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('lb_prev')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled || p === 0),
                new ButtonBuilder()
                    .setCustomId('lb_next')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled || p >= totalPages - 1),
            );
        }

        const reply = await msg.reply({
            embeds: [buildEmbed(0)],
            components: totalPages > 1 ? [buildRow(0)] : [],
        });

        if (totalPages <= 1) return;

        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === msg.author.id,
            time: 60_000,
        });

        collector.on('collect', async i => {
            if (i.customId === 'lb_prev') page = Math.max(0, page - 1);
            if (i.customId === 'lb_next') page = Math.min(totalPages - 1, page + 1);
            await i.update({ embeds: [buildEmbed(page)], components: [buildRow(page)] });
        });

        collector.on('end', () => {
            reply.edit({ components: [buildRow(page, true)] }).catch(() => {});
        });
    },
};
