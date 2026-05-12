const { EmbedBuilder } = require('discord.js');
const { addXP } = require('../../utils/dataManager');
const { errEmbed } = require('../../utils/embeds');
const { OWNER_ID } = require('../../utils/constants');

module.exports = {
    name: 'givexp',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (member.id !== OWNER_ID) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await guild.members.fetch(args[0]?.replace(/[<@!>]/g, '')).catch(() => null);
        const amount = parseInt(args[1]);
        if (!target || isNaN(amount) || amount <= 0)
            return msg.reply({ embeds: [errEmbed('Usage: `.givexp @user [amount]`')] });
        await addXP(target.id, amount, guild);
        return msg.reply({ embeds: [new EmbedBuilder().setColor(0xFFD700)
            .setDescription(`✅  Added **${amount} XP** to ${target}.`)] });
    },
};
