const { EmbedBuilder } = require('discord.js');
const { updateMember } = require('../../../utils/mainData');
const { ft, errEmbed, hasVerifPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'sas',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasVerifPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        await updateMember(target.id, { $set: { isSas: true } });
        const e = new EmbedBuilder().setColor(C.WARN)
            .setDescription(`📋  ${target} added to the **Sas List**.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
