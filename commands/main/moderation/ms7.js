const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasStaffPerms } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'ms7',
    execute: async (msg, args, client) => {
        const { guild, member, channel } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const amount = parseInt(args[0]);
        if (!args[0] || isNaN(amount) || amount < 1 || amount > 100)
            return msg.reply({ embeds: [errEmbed('Usage: `+ms7 [1-100]`')] });
        await msg.delete().catch(e => log.debug('[DEBUG]', e.message));
        const deleted = await channel.bulkDelete(amount, true).catch(() => null);
        const count   = deleted?.size ?? 0;
        const notice  = await channel.send({
            embeds: [new EmbedBuilder().setColor(C.JAIL)
                .setDescription(`🗑️  **${count}** message(s) deleted by ${member}.`)
                .setFooter(ft(client))],
        });
        setTimeout(() => notice.delete().catch(e => log.debug('[DEBUG]', e.message)), 4000);
    },
};
