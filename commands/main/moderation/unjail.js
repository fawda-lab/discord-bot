const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { getMember, updateMember } = require('../../../utils/mainData');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C, ROLES, LOG_CHANNELS } = require('../../../utils/mainConstants');

module.exports = {
    name: 'unjail',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target   = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const isGirl   = args[1]?.toLowerCase() === 'g';

        const doc = await getMember(target.id);
        if (!doc.jail) return msg.reply({ embeds: [errEmbed('That member is not jailed.')] });

        const jailRole = guild.roles.cache.get(ROLES.JAIL);
        if (jailRole) await target.roles.remove(jailRole).catch(e => log.debug('[DEBUG]', e.message));
        const roleToAdd = guild.roles.cache.get(isGirl ? ROLES.GIRL : ROLES.BOY);
        if (roleToAdd) await target.roles.add(roleToAdd).catch(e => log.debug('[DEBUG]', e.message));

        await updateMember(target.id, { $set: { jail: null } });

        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle(`🔓  Unjailed as ${isGirl ? 'Girl' : 'Boy'}`)
            .setColor(C.VERIF)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`, inline: true },
                { name: '🛡️ By',    value: `${member}`, inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        await msg.reply({ embeds: [e] });
        const logCh = await guild.channels.fetch(LOG_CHANNELS.JAIL).catch(() => null);
        if (logCh) await logCh.send({ embeds: [e] }).catch(e => log.error('[UnjailLog]', e.message));
    },
};
