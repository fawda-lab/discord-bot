const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Member = require('../../utils/models/Member');
const { errEmbed } = require('../../utils/embeds');
const { OWNER_ID } = require('../../utils/constants');

module.exports = {
    name: 'resetxp',
    execute: async (msg, args) => {
        const { guild, member } = msg;
        if (member.id !== OWNER_ID) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await guild.members.fetch(args[0]?.replace(/[<@!>]/g, '')).catch(() => null);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rxp_confirm').setLabel('✅ Confirm').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('rxp_cancel').setLabel('❌ Cancel').setStyle(ButtonStyle.Secondary),
        );

        const reply = await msg.reply({
            embeds: [new EmbedBuilder()
                .setColor(0xFEE75C)
                .setTitle('⚠️ Confirm Reset')
                .setDescription(`Are you sure you want to reset XP for ${target}?\nThis action cannot be undone.`)],
            components: [row],
        });

        try {
            const i = await reply.awaitMessageComponent({
                filter: i => i.user.id === msg.author.id,
                time: 15_000,
            });
            if (i.customId === 'rxp_confirm') {
                await Member.findByIdAndUpdate(target.id, { $set: { xp: 0, lastMsg: 0 } });
                await i.update({
                    embeds: [new EmbedBuilder().setColor(0x57F287)
                        .setDescription(`✅ XP reset complete for ${target}.`)],
                    components: [],
                });
            } else {
                await i.update({
                    embeds: [new EmbedBuilder().setColor(0x99AAB5).setDescription('❌ Action cancelled.')],
                    components: [],
                });
            }
        } catch {
            await reply.edit({
                embeds: [new EmbedBuilder().setColor(0x99AAB5).setDescription('⏱️ Action timed out.')],
                components: [],
            });
        }
    },
};
