const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'role',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const roleName = args.slice(1).join(' ');
        if (!roleName) return msg.reply({ embeds: [errEmbed('Usage: `!role @user [role_name]`')] });
        const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
        if (!role) return msg.reply({ embeds: [errEmbed(`Role **${roleName}** not found.`)] });

        const hasRole = target.roles.cache.has(role.id);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('role_add').setLabel('➕ Add').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('role_remove').setLabel('➖ Remove').setStyle(ButtonStyle.Danger),
        );
        const reply = await msg.reply({
            embeds: [new EmbedBuilder()
                .setColor(C.INFO)
                .setTitle('🎭  Role Management')
                .setDescription(`${target} ${hasRole ? '**has**' : '**does not have**'} **${role.name}**.\nWhat do you want to do?`)
                .setFooter(ft(client))],
            components: [row],
        });

        try {
            const i = await reply.awaitMessageComponent({ filter: i => i.user.id === msg.author.id, time: 15_000 });
            if (i.customId === 'role_add') {
                await target.roles.add(role);
                await i.update({ embeds: [new EmbedBuilder().setColor(C.VERIF).setDescription(`✅  **${role.name}** added to ${target}.`).setFooter(ft(client))], components: [] });
            } else {
                await target.roles.remove(role);
                await i.update({ embeds: [new EmbedBuilder().setColor(C.JAIL).setDescription(`✅  **${role.name}** removed from ${target}.`).setFooter(ft(client))], components: [] });
            }
        } catch {
            await reply.edit({ embeds: [new EmbedBuilder().setColor(C.MUTED).setDescription('⏱️  Timed out.')], components: [] });
        }
    },
};
