const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasStaffPerms } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'denyrole',
    execute: async (msg, args, client) => {
        const { guild, member, channel } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const roleId = args[0]?.replace(/[<@&>]/g, '');
        if (!roleId) return msg.reply({ embeds: [errEmbed('Usage: `!denyrole @role`')] });
        const role = guild.roles.cache.get(roleId);
        if (!role) return msg.reply({ embeds: [errEmbed('Role not found.')] });
        await channel.permissionOverwrites.edit(role, { SendMessages: false });
        const e = new EmbedBuilder().setColor(C.JAIL)
            .setDescription(`🚫  **${role.name}** can no longer send messages in ${channel}.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
