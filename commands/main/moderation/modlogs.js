const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getMember } = require('../../../utils/mainData');
const { ft, errEmbed, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

const PAGE_SIZE = 5;

module.exports = {
    name: 'modlogs',
    aliases: ['ml'],
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        const isAdmin = member.permissions.has('Administrator') || guild.ownerId === member.id;
        if (!isAdmin) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });

        const doc = await getMember(target.id);

        const entries = [];
        for (const w of doc.warns ?? []) {
            entries.push({ type: 'warn', reason: w.reason, by: w.by, at: w.at, extra: null });
        }
        if (doc.jail) {
            entries.push({ type: 'jail', reason: doc.jail.reason, by: doc.jail.jailedBy, at: doc.jail.timestamp, extra: null });
        }
        for (const t of doc.timeouts ?? []) {
            entries.push({ type: 'timeout', reason: t.reason, by: t.by, at: t.at, extra: t.duration });
        }

        entries.sort((a, b) => new Date(a.at) - new Date(b.at));

        if (entries.length === 0) {
            const e = new EmbedBuilder()
                .setColor(C.INFO)
                .setTitle(`📋 Mod Logs — ${target.displayName}`)
                .setDescription('No moderation history found.')
                .setFooter(ft(client)).setTimestamp();
            return msg.reply({ embeds: [e] });
        }

        const totalPages = Math.ceil(entries.length / PAGE_SIZE);
        let page = 0;

        function buildEmbed(p) {
            const slice = entries.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
            const e = new EmbedBuilder()
                .setColor(C.INFO)
                .setTitle(`📋 Mod Logs — ${target.displayName}`)
                .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Page ${p + 1}/${totalPages} • ${entries.length} entries | ${ft(client).text}`, iconURL: client.user.displayAvatarURL() })
                .setTimestamp();
            for (const entry of slice) {
                const icon  = entry.type === 'warn' ? '⚠️' : entry.type === 'jail' ? '🔒' : '⏱️';
                const label = entry.type === 'warn' ? 'Warn' : entry.type === 'jail' ? 'Jail' : `Timeout (${entry.extra})`;
                const date  = new Date(entry.at).toLocaleDateString('en-GB');
                e.addFields({
                    name:  `${icon} ${label} — ${date}`,
                    value: `📝 ${entry.reason}\n🛡️ <@${entry.by}>`,
                    inline: false,
                });
            }
            return e;
        }

        function buildRow(p) {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ml_prev')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(p === 0),
                new ButtonBuilder()
                    .setCustomId('ml_next')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(p >= totalPages - 1),
            );
        }

        const reply = await msg.reply({
            embeds: [buildEmbed(0)],
            components: totalPages > 1 ? [buildRow(0)] : [],
        });

        if (totalPages <= 1) return;

        const collector = reply.createMessageComponentCollector({
            filter: i => i.user.id === msg.author.id,
            time: 120_000,
        });

        collector.on('collect', async i => {
            if (i.customId === 'ml_prev') page = Math.max(0, page - 1);
            if (i.customId === 'ml_next') page = Math.min(totalPages - 1, page + 1);
            await i.update({ embeds: [buildEmbed(page)], components: [buildRow(page)] });
        });

        collector.on('end', () => {
            reply.edit({ components: [] }).catch(() => {});
        });
    },
};
