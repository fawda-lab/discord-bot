const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { updateMember } = require('../../../utils/mainData');
const { ft, errEmbed, hasVerifPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C, ROLES } = require('../../../utils/mainConstants');

module.exports = {
    name: 'vb',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasVerifPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const boy  = guild.roles.cache.get(ROLES.BOY);
        const male = guild.roles.cache.get(ROLES.MALE);
        const unv  = guild.roles.cache.get(ROLES.UNVERIFIED);
        if (boy)  await target.roles.add(boy).catch(e => log.debug('[DEBUG]', e.message));
        if (male) await target.roles.add(male).catch(e => log.debug('[DEBUG]', e.message));
        if (unv)  await target.roles.remove(unv).catch(e => log.debug('[DEBUG]', e.message));

        const doc = await updateMember(member.id, { $inc: { 'staffStats.verificationsDone': 1 } });
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('✅  Verified as Boy')
            .setColor(C.VERIF)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`,                                                        inline: true },
                { name: '🛡️ By',    value: `${member}`,                                                        inline: true },
                { name: '📊 Total',  value: `\`${doc.staffStats.verificationsDone}\` verifications`,            inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
