const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C, LOG_CHANNELS } = require('../../../utils/mainConstants');

module.exports = {
    name: 'nick',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const nick = args.slice(1).join(' ') || null;

        await target.setNickname(nick, `Changed by ${member.user.tag}`);

        const e = new EmbedBuilder().setColor(C.INFO)
            .setDescription(`✏️  Nickname for ${target} ${nick ? `set to **${nick}**` : '**reset**.'}`)
            .setFooter(ft(client));
        await msg.reply({ embeds: [e] });

        const logEmbed = new EmbedBuilder()
            .setTitle('✏️  Nickname Changed')
            .setColor(C.INFO)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member',   value: `${target}`,      inline: true  },
                { name: '🛡️ By',      value: `${member}`,      inline: true  },
                { name: '📝 Nickname', value: nick ?? '*(reset)*', inline: false },
            )
            .setTimestamp();
        const logCh = await guild.channels.fetch(LOG_CHANNELS.ALL).catch(() => null);
        if (logCh) await logCh.send({ embeds: [logEmbed] }).catch(e => log.error('[NickLog]', e.message));
    },
};
