const { EmbedBuilder } = require('discord.js');
const Member = require('../../utils/models/Member');
const { errEmbed } = require('../../utils/embeds');
const { OWNER_ID } = require('../../utils/constants');

module.exports = {
    name: 'resetxp',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (member.id !== OWNER_ID) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await guild.members.fetch(args[0]?.replace(/[<@!>]/g, '')).catch(() => null);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        await Member.findByIdAndUpdate(target.id, { $set: { xp: 0, lastMsg: 0 } });
        return msg.reply({ embeds: [new EmbedBuilder().setColor(0xED4245)
            .setDescription(`🗑️  XP reset for ${target}.`)] });
    },
};
