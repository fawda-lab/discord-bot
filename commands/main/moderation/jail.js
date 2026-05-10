const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { updateMember } = require('../../../utils/mainData');
const { canModerate } = require('../../../utils/permissions');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C, ROLES, LOG_CHANNELS } = require('../../../utils/mainConstants');

module.exports = {
    name: 'jail',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        if (!canModerate(member, target)) return msg.reply({ embeds: [errEmbed('You cannot moderate someone with an equal or higher role.')] });
        const reason   = args.slice(1).join(' ') || 'No reason provided';
        const jailRole = guild.roles.cache.get(ROLES.JAIL);
        if (jailRole) {
            const rolesToRemove = target.roles.cache.filter(r => r.id !== guild.roles.everyone.id && r.id !== ROLES.JAIL);
            for (const [, r] of rolesToRemove) {
                await target.roles.remove(r).catch(e => log.debug('[DEBUG]', e.message));
                await new Promise(res => setTimeout(res, 300));
            }
            await target.roles.add(jailRole).catch(e => log.debug('[DEBUG]', e.message));
        }

        await updateMember(target.id, {
            $set: {
                jail: {
                    reason, jailedBy: member.id,
                    timestamp: new Date().toISOString(),
                    rolesSnapshot: target.roles.cache.map(r => r.id).filter(id => id !== guild.roles.everyone.id),
                },
            },
        });
        await updateMember(member.id, { $inc: { 'staffStats.jailsDone': 1 } });

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
        const logCh = await guild.channels.fetch(LOG_CHANNELS.JAIL).catch(() => null);
        if (logCh) await logCh.send({ embeds: [e] }).catch(e => log.error('[JailLog]', e.message));
    },
};
