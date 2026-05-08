const { EmbedBuilder } = require('discord.js');
const { loadData, saveData } = require('../../utils/dataManager');
const { errEmbed } = require('../../utils/embeds');
const { OWNER_ID } = require('../../utils/constants');

module.exports = {
    name: 'resetxp',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (member.id !== OWNER_ID) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await guild.members.fetch(args[0]?.replace(/[<@!>]/g, '')).catch(() => null);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        const data = loadData();
        delete data.users[target.id];
        saveData(data);
        return msg.reply({ embeds: [new EmbedBuilder().setColor(0xED4245)
            .setDescription(`🗑️  XP reset for ${target}.`)] });
    },
};
