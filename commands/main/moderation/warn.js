const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { updateMember } = require('../../../utils/mainData');
const { canModerate } = require('../../../utils/permissions');
const { ft, errEmbed, warnBar, warnColor, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { ROLES, LOG_CHANNELS } = require('../../../utils/mainConstants');

module.exports = {
    name: 'warn',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        if (!canModerate(member, target)) return msg.reply({ embeds: [errEmbed('You cannot moderate someone with an equal or higher role.')] });
        const reason = args.slice(1).join(' ') || 'No reason provided';

        const doc = await updateMember(target.id, {
            $push: { warns: { reason, by: member.id, at: new Date().toISOString() } },
        });
        const count = doc.warns.length;

        // Always clear existing warn roles before assigning the new one
        for (const roleId of [ROLES.FIRST_WARN, ROLES.SECOND_WARN, ROLES.LAST_WARN]) {
            const r = guild.roles.cache.get(roleId);
            if (r && target.roles.cache.has(roleId))
                await target.roles.remove(r).catch(e => log.debug('[DEBUG]', e.message));
        }

        if (count === 1) {
            const r = guild.roles.cache.get(ROLES.FIRST_WARN);
            if (r) await target.roles.add(r).catch(e => log.debug('[DEBUG]', e.message));
        } else if (count === 2) {
            const r = guild.roles.cache.get(ROLES.SECOND_WARN);
            if (r) await target.roles.add(r).catch(e => log.debug('[DEBUG]', e.message));
        } else if (count === 3) {
            const r = guild.roles.cache.get(ROLES.LAST_WARN);
            if (r) await target.roles.add(r).catch(e => log.debug('[DEBUG]', e.message));
        } else {
            // 4th warn → auto-jail: snapshot roles, strip all, assign JAIL, persist
            const rolesSnapshot = target.roles.cache
                .filter(r => r.id !== guild.roles.everyone.id)
                .map(r => r.id);

            const jailRole = guild.roles.cache.get(ROLES.JAIL);
            const rolesToStrip = target.roles.cache.filter(
                r => r.id !== guild.roles.everyone.id && r.id !== ROLES.JAIL
            );
            for (const [, r] of rolesToStrip) {
                await target.roles.remove(r).catch(e => log.debug('[DEBUG]', e.message));
                await new Promise(res => setTimeout(res, 300));
            }
            if (jailRole) await target.roles.add(jailRole).catch(e => log.debug('[DEBUG]', e.message));

            await updateMember(target.id, {
                $set: {
                    jail: {
                        reason:        `Auto-jail: ${count} warns — last: ${reason}`,
                        jailedBy:      client.user.id,
                        timestamp:     new Date().toISOString(),
                        rolesSnapshot,
                    },
                },
            });
        }

        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle(`⚠️  Warn #${count}`)
            .setColor(warnColor(count))
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`,    inline: true  },
                { name: '📊 Warns',  value: warnBar(count), inline: true  },
                { name: '🛡️ By',    value: `${member}`,    inline: true  },
                { name: '📝 Reason', value: reason,          inline: false },
            )
            .setFooter(ft(client)).setTimestamp();

        await msg.reply({ embeds: [e] });

        if (count >= 4) {
            await target.send(
                `🔒 You have been **auto-jailed** in **${guild.name}** after accumulating ${count} warns.\n📝 Last reason: ${reason}`
            ).catch(e => log.debug('[DEBUG]', e.message));
            const logCh = await guild.channels.fetch(LOG_CHANNELS.JAIL).catch(() => null);
            if (logCh) await logCh.send({ embeds: [e] }).catch(e => log.error('[JailLog]', e.message));
        } else {
            await target.send(
                `⚠️ You received a **warn** in **${guild.name}**.\n📝 Reason: ${reason}\n📊 Total: ${warnBar(count)} (${count}/3)`
            ).catch(e => log.debug('[DEBUG]', e.message));
            const logCh = await guild.channels.fetch(LOG_CHANNELS.WARN).catch(() => null);
            if (logCh) await logCh.send({ embeds: [e] }).catch(e => log.error('[WarnLog]', e.message));
        }
    },
};
