const { EmbedBuilder } = require('discord.js');
const { ft } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'vc',
    execute: async (msg, args, client) => {
        const { guild } = msg;
        await guild.members.fetch();
        const online  = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
        const inVoice = guild.members.cache.filter(m => m.voice?.channel).size;
        const e = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
            .setTitle('📊  Server Statistics')
            .setColor(C.VOICE)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👥 Members',  value: `\`${guild.memberCount}\``,                  inline: true },
                { name: '🟢 Online',   value: `\`${online}\``,                              inline: true },
                { name: '🔊 In Voice', value: `\`${inVoice}\``,                             inline: true },
                { name: '💬 Channels', value: `\`${guild.channels.cache.size}\``,            inline: true },
                { name: '🏷️ Roles',   value: `\`${guild.roles.cache.size}\``,              inline: true },
                { name: '🚀 Boosts',   value: `\`${guild.premiumSubscriptionCount ?? 0}\``, inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
