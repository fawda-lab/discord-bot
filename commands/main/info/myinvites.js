const { EmbedBuilder } = require('discord.js');
const { ft, errEmbed } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'myinvites',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        const invites = await guild.invites.fetch().catch(() => null);
        if (!invites) return msg.reply({ embeds: [errEmbed('Could not fetch invites.')] });
        const mine = invites.filter(inv => inv.inviterId === member.id);
        if (!mine.size) return msg.reply({ embeds: [errEmbed('You have no active invites.')] });
        const lines = mine.map(inv =>
            `\`${inv.code}\` — **${inv.uses}** uses — ${inv.expiresAt ? `<t:${Math.floor(inv.expiresAt.getTime()/1000)}:R>` : 'Never expires'}`
        );
        const e = new EmbedBuilder()
            .setTitle(`📨  Your Invites — ${member.displayName}`)
            .setColor(C.INFO)
            .setDescription(lines.join('\n'))
            .setFooter(ft(client)).setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
