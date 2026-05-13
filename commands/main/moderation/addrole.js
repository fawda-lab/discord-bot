const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasStaffPerms } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'addrole',
    execute: async (msg, args, client) => {
        const { guild, member, channel } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const roleId = args[0]?.replace(/[<@&>]/g, '');
        if (!roleId) return msg.reply({ embeds: [errEmbed('Usage: `!addrole @role`')] });
        const role = guild.roles.cache.get(roleId);
        if (!role) return msg.reply({ embeds: [errEmbed('Role not found.')] });
        await channel.permissionOverwrites.edit(role, { SendMessages: true });
        const e = new EmbedBuilder().setColor(C.VERIF)
            .setDescription(`✅  **${role.name}** can now send messages in ${channel}.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
