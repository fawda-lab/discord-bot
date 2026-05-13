const { errEmbed, hasStaffPerms } = require('../../../utils/mainHelpers');

module.exports = {
    name: 'mr',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const roleId = args[0]?.replace(/[<@&>]/g, '');
        if (!roleId) return msg.reply({ embeds: [errEmbed('Usage: `!mr @role`')] });
        const role = guild.roles.cache.get(roleId);
        if (!role) return msg.reply({ embeds: [errEmbed('Role not found.')] });
        await msg.delete().catch(() => {});
        await msg.channel.send(`<@&${role.id}>`);
    },
};
