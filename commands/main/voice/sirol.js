const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasStaffPerms } = require('../../../utils/mainHelpers');
const { C, LOG_CHANNELS } = require('../../../utils/mainConstants');

module.exports = {
    name: 'sirol',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const fromChannel = member.voice?.channel;
        if (!fromChannel) return msg.reply({ embeds: [errEmbed('You are not in a voice channel.')] });
        const toId = args[0];
        if (!toId) return msg.reply({ embeds: [errEmbed('Usage: `!sirol [room_id]`')] });
        const toChannel = guild.channels.cache.get(toId);
        if (!toChannel) return msg.reply({ embeds: [errEmbed('Target channel not found.')] });

        const members = [...fromChannel.members.values()];
        if (!members.length) return msg.reply({ embeds: [errEmbed('Your voice channel is empty.')] });

        for (const m of members) {
            await m.voice.setChannel(toChannel).catch(e => log.debug('[DEBUG]', e.message));
        }

        const e = new EmbedBuilder().setColor(C.VOICE)
            .setDescription(`🔊  Moved **${members.length}** user(s) from **${fromChannel.name}** → **${toChannel.name}**.`)
            .setFooter(ft(client));
        await msg.reply({ embeds: [e] });

        const logEmbed = new EmbedBuilder()
            .setTitle('🔊  Mass Voice Move')
            .setColor(C.VOICE)
            .addFields(
                { name: '🛡️ By',   value: `${member}`,          inline: true },
                { name: '📤 From', value: fromChannel.name,      inline: true },
                { name: '📥 To',   value: toChannel.name,        inline: true },
                { name: '👥 Count', value: `${members.length}`,  inline: true },
            )
            .setTimestamp();
        const logCh = await guild.channels.fetch(LOG_CHANNELS.MOVE).catch(() => null);
        if (logCh) await logCh.send({ embeds: [logEmbed] }).catch(e => log.error('[SirolLog]', e.message));
    },
};
