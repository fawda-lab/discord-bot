const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasStaffPerms } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'ms7',
    execute: async (msg, args, client) => {
        const { member, channel } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const amount = parseInt(args[0]);
        if (!args[0] || isNaN(amount) || amount < 1 || amount > 100)
            return msg.reply({ embeds: [errEmbed('Usage: `+ms7 [1-100]`')] });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ms7_confirm').setLabel('✅ Confirm').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ms7_cancel').setLabel('❌ Cancel').setStyle(ButtonStyle.Secondary),
        );

        const reply = await msg.reply({
            embeds: [new EmbedBuilder()
                .setColor(C.WARN)
                .setTitle('⚠️ Confirm Deletion')
                .setDescription(`Are you sure you want to delete **${amount}** message(s) in ${channel}?`)
                .setFooter(ft(client))],
            components: [row],
        });

        try {
            const i = await reply.awaitMessageComponent({
                filter: i => i.user.id === msg.author.id,
                time: 15_000,
            });
            if (i.customId === 'ms7_confirm') {
                await i.update({
                    embeds: [new EmbedBuilder().setColor(C.JAIL).setDescription('⌛ Deleting...')],
                    components: [],
                });
                await msg.delete().catch(e => log.debug('[DEBUG]', e.message));
                const deleted = await channel.bulkDelete(amount, true).catch(() => null);
                const count   = deleted?.size ?? 0;
                const notice  = await channel.send({
                    embeds: [new EmbedBuilder()
                        .setColor(C.VERIF)
                        .setDescription(`✅ Deleted **${count}** message(s) by ${member}.`)
                        .setFooter(ft(client))],
                });
                setTimeout(() => notice.delete().catch(e => log.debug('[DEBUG]', e.message)), 4000);
            } else {
                await i.update({
                    embeds: [new EmbedBuilder().setColor(0x99AAB5).setDescription('❌ Action cancelled.')],
                    components: [],
                });
                setTimeout(() => reply.delete().catch(e => log.debug('[DEBUG]', e.message)), 3000);
            }
        } catch {
            await reply.edit({
                embeds: [new EmbedBuilder().setColor(0x99AAB5).setDescription('⏱️ Action timed out.')],
                components: [],
            });
            setTimeout(() => reply.delete().catch(e => log.debug('[DEBUG]', e.message)), 3000);
        }
    },
};
