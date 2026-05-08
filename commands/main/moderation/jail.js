const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { loadData, saveData, sleep } = require('../../../utils/mainData');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C, ROLES } = require('../../../utils/mainConstants');

module.exports = {
    name: 'jail',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const reason   = args.slice(1).join(' ') || 'No reason provided';
        const jailRole = guild.roles.cache.get(ROLES.JAIL);
        if (jailRole) {
            const rolesToRemove = target.roles.cache.filter(r => r.id !== guild.roles.everyone.id && r.id !== ROLES.JAIL);
            for (const [, r] of rolesToRemove) {
                await target.roles.remove(r).catch(e => log.debug('[DEBUG]', e.message));
                await sleep(300);
            }
            await target.roles.add(jailRole).catch(e => log.debug('[DEBUG]', e.message));
        }
        const data = loadData();
        data.jailed[target.id] = {
            reason, jailedBy: member.id,
            rolesSnapshot: target.roles.cache.map(r => r.id).filter(id => id !== guild.roles.everyone.id),
            timestamp: new Date().toISOString(),
        };
        data.jailActions[member.id] = (data.jailActions[member.id] || 0) + 1;
        saveData(data);
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('🔒  Member Jailed')
            .setColor(C.JAIL)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`, inline: true  },
                { name: '🛡️ By',    value: `${member}`, inline: true  },
                { name: '📝 Reason', value: reason,       inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        await msg.reply({ embeds: [e] });
        await target.send(`🔒 You have been **jailed** in **${guild.name}**.\n📝 Reason: ${reason}`)
            .catch(e => log.debug('[DEBUG]', e.message));
    },
};
