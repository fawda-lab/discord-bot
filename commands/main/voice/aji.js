const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C, LOG_CHANNELS } = require('../../../utils/mainConstants');

module.exports = {
    name: 'aji',
    cooldown: 60,
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const chId = args[1]?.replace(/[<#>]/g, '');
        const vc   = chId ? guild.channels.cache.get(chId) : member.voice?.channel;
        if (!vc) return msg.reply({ embeds: [errEmbed(chId ? 'Channel not found.' : 'You are not in a voice channel.')] });
        if (!target.voice?.channel) return msg.reply({ embeds: [errEmbed(`${target} is not in a voice channel.`)] });

        const fromChannel = target.voice.channel;
        await target.voice.setChannel(vc);

        const e = new EmbedBuilder().setColor(C.VOICE)
            .setDescription(`🔊  ${target} moved to **${vc.name}**.`)
            .setFooter(ft(client));
        await msg.reply({ embeds: [e] });

        const logEmbed = new EmbedBuilder()
            .setTitle('🔊  Voice Move')
            .setColor(C.VOICE)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Member', value: `${target}`,          inline: true  },
                { name: '🛡️ By',    value: `${member}`,           inline: true  },
                { name: '📤 From',   value: fromChannel.name,      inline: true  },
                { name: '📥 To',     value: vc.name,               inline: true  },
            )
            .setTimestamp();
        const logCh = await guild.channels.fetch(LOG_CHANNELS.MOVE).catch(() => null);
        if (logCh) await logCh.send({ embeds: [logEmbed] }).catch(e => log.error('[MoveLog]', e.message));
    },
};
