const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { loadData, saveData } = require('../../../utils/mainData');
const { ft, errEmbed, warnBar, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C, ROLES } = require('../../../utils/mainConstants');

module.exports = {
    name: 'unwarn',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const data = loadData();
        if (!data.warns[target.id] || data.warns[target.id].count === 0)
            return msg.reply({ embeds: [errEmbed('That member has no warns.')] });
        data.warns[target.id].count--;
        data.warns[target.id].reasons.pop();
        const newCount = data.warns[target.id].count;
        saveData(data);
        const allWarnRoles = [ROLES.FIRST_WARN, ROLES.SECOND_WARN, ROLES.LAST_WARN, ROLES.MUTED];
        for (const roleId of allWarnRoles) {
            const r = guild.roles.cache.get(roleId);
            if (r && target.roles.cache.has(roleId)) await target.roles.remove(r).catch(e => log.debug('[DEBUG]', e.message));
        }
        const warnRoleMap = { 1: ROLES.FIRST_WARN, 2: ROLES.SECOND_WARN, 3: ROLES.LAST_WARN };
        if (warnRoleMap[newCount]) {
            const r = guild.roles.cache.get(warnRoleMap[newCount]);
            if (r) await target.roles.add(r).catch(e => log.debug('[DEBUG]', e.message));
        }
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('✅  Warn Removed')
            .setColor(C.VERIF)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member',    value: `${target}`,       inline: true },
                { name: '📊 Remaining', value: warnBar(newCount),  inline: true },
                { name: '🛡️ By',       value: `${member}`,       inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
