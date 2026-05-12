const { EmbedBuilder } = require('discord.js');
const { ft, errEmbed } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'inviteowner',
    execute: async (msg, args, client) => {
        const { guild } = msg;
        const code = args[0];
        if (!code) return msg.reply({ embeds: [errEmbed('Usage: `!inviteowner <code>`')] });
        const invites = await guild.invites.fetch().catch(() => null);
        if (!invites) return msg.reply({ embeds: [errEmbed('Could not fetch invites.')] });
        const inv = invites.get(code);
        if (!inv) return msg.reply({ embeds: [errEmbed('Invite not found.')] });
        const e = new EmbedBuilder()
            .setTitle('📨  Invite Info')
            .setColor(C.INFO)
            .addFields(
                { name: '🔗 Code',    value: `\`${inv.code}\``,     inline: true },
                { name: '👤 Owner',   value: `<@${inv.inviterId}>`, inline: true },
                { name: '📊 Uses',    value: `\`${inv.uses}\``,      inline: true },
                { name: '💬 Channel', value: `${inv.channel}`,       inline: true },
            )
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
