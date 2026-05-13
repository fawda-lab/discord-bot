const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ft, errEmbed, resolveUser } = require('../../../utils/mainHelpers');
const { C, TEAMS, OWNER_ROLES } = require('../../../utils/mainConstants');

async function doAction(sub, target, team, guild, client) {
    const role = guild.roles.cache.get(team.teamRole);
    if (!role)
        return { embeds: [errEmbed(`Team role for **${team.name}** not found.`)] };

    if (sub === 'add') {
        if (target.roles.cache.has(role.id))
            return { embeds: [errEmbed(`${target} already has the **${team.name}** role.`)] };
        await target.roles.add(role);
        return { embeds: [new EmbedBuilder().setColor(C.VERIF)
            .setDescription(`✅  ${target} added to the **${team.name}** team.`)
            .setFooter(ft(client))] };
    }

    if (sub === 'remove') {
        if (!target.roles.cache.has(role.id))
            return { embeds: [errEmbed(`${target} doesn't have the **${team.name}** role.`)] };
        await target.roles.remove(role);
        return { embeds: [new EmbedBuilder().setColor(C.JAIL)
            .setDescription(`✅  ${target} removed from the **${team.name}** team.`)
            .setFooter(ft(client))] };
    }

    if (sub === 'list') {
        await guild.members.fetch();
        if (!role.members.size)
            return { embeds: [errEmbed(`No members in the **${team.name}** team.`)] };
        const e = new EmbedBuilder()
            .setTitle(`👥  ${team.name} Team`)
            .setColor(C.INFO)
            .setDescription([...role.members.values()].map((m, i) => `**${i + 1}.** ${m}`).join('\n'))
            .setFooter(ft(client)).setTimestamp();
        return { embeds: [e] };
    }
}

module.exports = {
    name: 'team',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        const sub = args[0]?.toLowerCase();
        if (!['add', 'remove', 'list'].includes(sub))
            return msg.reply({ embeds: [errEmbed('Usage: `!team <add|remove|list> [@user]`')] });

        const isOwner = OWNER_ROLES.some(id => member.roles.cache.has(id));
        const managedTeams = isOwner
            ? TEAMS
            : TEAMS.filter(t => t.headRoles.some(id => member.roles.cache.has(id)));

        if (!managedTeams.length)
            return msg.reply({ embeds: [errEmbed("You don't manage any team.")] });

        let target = null;
        if (sub !== 'list') {
            target = await resolveUser(guild, args[1]);
            if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        }

        // Single team — act directly, no panel needed
        if (managedTeams.length === 1) {
            const result = await doAction(sub, target, managedTeams[0], guild, client);
            return msg.reply(result);
        }

        // Multiple teams — build selection panel (max 5 buttons per row)
        const rows = [];
        for (let i = 0; i < managedTeams.length; i += 5) {
            rows.push(new ActionRowBuilder().addComponents(
                managedTeams.slice(i, i + 5).map(t =>
                    new ButtonBuilder()
                        .setCustomId(`team_${t.name.replace(/ /g, '_')}`)
                        .setLabel(t.name)
                        .setStyle(ButtonStyle.Primary)
                )
            ));
        }

        const desc = sub === 'list'
            ? 'Which team do you want to list?'
            : `Which team do you want to **${sub}** ${target} ${sub === 'add' ? 'to' : 'from'}?`;

        const reply = await msg.reply({
            embeds: [new EmbedBuilder()
                .setColor(C.INFO)
                .setTitle('👥  Select a Team')
                .setDescription(desc)
                .setFooter(ft(client))],
            components: rows,
        });

        try {
            const i = await reply.awaitMessageComponent({
                filter: i => i.user.id === msg.author.id,
                time: 15_000,
            });
            const teamName = i.customId.replace('team_', '').replace(/_/g, ' ');
            const team = managedTeams.find(t => t.name === teamName);
            if (!team) {
                await i.update({ embeds: [errEmbed('Team not found.')], components: [] });
                return;
            }
            const result = await doAction(sub, target, team, guild, client);
            await i.update({ ...result, components: [] });
        } catch {
            await reply.edit({
                embeds: [new EmbedBuilder().setColor(C.MUTED).setDescription('⏱️  Timed out.')],
                components: [],
            });
        }
    },
};
