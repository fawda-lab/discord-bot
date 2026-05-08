const { EmbedBuilder } = require('discord.js');
const { ft, errEmbed, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'user',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        const target = args[0] ? await resolveUser(guild, args[0]) : member;
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const user  = await client.users.fetch(target.id, { force: true });
        const roles = target.roles.cache
            .filter(r => r.id !== guild.roles.everyone.id)
            .sort((a, b) => b.position - a.position)
            .map(r => r.toString()).slice(0, 10).join(' ') || 'None';
        const e = new EmbedBuilder()
            .setTitle(`👤  ${target.displayName}`)
            .setColor(target.displayHexColor || C.INFO)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🏷️ Username',       value: `\`${user.username}\``,                               inline: true  },
                { name: '🆔 ID',              value: `\`${user.id}\``,                                     inline: true  },
                { name: '📅 Joined Server',   value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`,  inline: false },
                { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,   inline: false },
                { name: `🏷️ Roles (${target.roles.cache.size - 1})`, value: roles,                         inline: false },
            )
            .setFooter(ft(client)).setTimestamp();
        if (user.bannerURL()) e.setImage(user.bannerURL({ dynamic: true }));
        return msg.reply({ embeds: [e] });
    },
};
