const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { loadData, saveData } = require('../../../utils/mainData');
const { ft, errEmbed, warnBar, warnColor, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C, ROLES } = require('../../../utils/mainConstants');

module.exports = {
    name: 'warn',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const reason = args.slice(1).join(' ') || 'No reason provided';
        const data   = loadData();
        if (!data.warns[target.id]) data.warns[target.id] = { count: 0, reasons: [] };
        data.warns[target.id].count++;
        data.warns[target.id].reasons.push({ reason, by: member.id, at: new Date().toISOString() });
        const count = data.warns[target.id].count;

        const warnRoles = [ROLES.FIRST_WARN, ROLES.SECOND_WARN, ROLES.LAST_WARN];
        for (const roleId of warnRoles) {
            const r = guild.roles.cache.get(roleId);
            if (r && target.roles.cache.has(roleId)) await target.roles.remove(r).catch(e => log.debug('[DEBUG]', e.message));
        }
        const warnRoleMap = { 1: ROLES.FIRST_WARN, 2: ROLES.SECOND_WARN, 3: ROLES.LAST_WARN };
        if (warnRoleMap[Math.min(count, 3)]) {
            const r = guild.roles.cache.get(warnRoleMap[Math.min(count, 3)]);
            if (r) await target.roles.add(r).catch(e => log.debug('[DEBUG]', e.message));
        }
        if (count === 3) {
            const muted = guild.roles.cache.get(ROLES.MUTED);
            if (muted) await target.roles.add(muted).catch(e => log.debug('[DEBUG]', e.message));
        }
        if (count >= 4) await target.kick(`Auto-kick: ${count} warns`).catch(e => log.debug('[DEBUG]', e.message));

        saveData(data);
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle(`⚠️  Warn #${count}`)
            .setColor(warnColor(count))
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`,       inline: true  },
                { name: '📊 Warns',  value: warnBar(count),     inline: true  },
                { name: '🛡️ By',    value: `${member}`,        inline: true  },
                { name: '📝 Reason', value: reason,             inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        await msg.reply({ embeds: [e] });
        await target.send(
            `⚠️ You received a **warn** in **${guild.name}**.\n📝 Reason: ${reason}\n📊 Total: ${warnBar(count)} (${count}/3)`
        ).catch(e => log.debug('[DEBUG]', e.message));
    },
};
