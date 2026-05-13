const { EmbedBuilder } = require('discord.js');
const { errEmbed, hasStaffPerms } = require('../../../utils/mainHelpers');

module.exports = {
    name: 'holders',
    execute: async (msg, args, client) => {
        const { guild, member, channel } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const roleId = args[0]?.replace(/[<@&>]/g, '');
        if (!roleId) return msg.reply({ embeds: [errEmbed('Usage: `!holders @role`')] });
        const role = guild.roles.cache.get(roleId);
        if (!role) return msg.reply({ embeds: [errEmbed('Role not found.')] });

        await guild.members.fetch();
        if (!role.members.size) return msg.reply({ embeds: [errEmbed(`No members have **${role.name}**.`)] });

        // Chunk mentions to stay under Discord's 2000-char limit
        const chunks = [];
        let current = '';
        for (const m of role.members.values()) {
            const mention = `<@${m.id}>`;
            if (current.length + mention.length + 1 > 1900) {
                chunks.push(current);
                current = mention;
            } else {
                current = current ? `${current} ${mention}` : mention;
            }
        }
        if (current) chunks.push(current);

        await msg.delete().catch(() => {});
        for (const chunk of chunks) await channel.send(chunk);
    },
};
