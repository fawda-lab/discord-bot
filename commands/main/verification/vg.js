const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { loadData, saveData } = require('../../../utils/mainData');
const { ft, errEmbed, hasVerifPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C, ROLES } = require('../../../utils/mainConstants');

module.exports = {
    name: 'vg',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasVerifPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const girl   = guild.roles.cache.get(ROLES.GIRL);
        const female = guild.roles.cache.get(ROLES.FEMALE);
        const unv    = guild.roles.cache.get(ROLES.UNVERIFIED);
        if (girl)   await target.roles.add(girl).catch(e => log.debug('[DEBUG]', e.message));
        if (female) await target.roles.add(female).catch(e => log.debug('[DEBUG]', e.message));
        if (unv)    await target.roles.remove(unv).catch(e => log.debug('[DEBUG]', e.message));
        const data = loadData();
        data.verifications[member.id] = (data.verifications[member.id] || 0) + 1;
        saveData(data);
        const e = new EmbedBuilder()
            .setAuthor({ name: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTitle('✅  Verified as Girl')
            .setColor(C.GIRL)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`,                                             inline: true },
                { name: '🛡️ By',    value: `${member}`,                                             inline: true },
                { name: '📊 Total',  value: `\`${data.verifications[member.id]}\` verifications`,    inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
