const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getMember, updateMember } = require('../../../utils/mainData');
const { ft, errEmbed, hasVerifPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'unsas',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasVerifPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });

        const doc = await getMember(target.id);
        if (!doc.sas?.active) return msg.reply({ embeds: [errEmbed('That member is not on the Sas List.')] });

        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
        if (!isAdmin && doc.sas.by !== member.id) {
            return msg.reply({ embeds: [errEmbed('You can only remove members you added to the Sas List.')] });
        }

        await updateMember(target.id, { $set: { sas: null } });
        const e = new EmbedBuilder().setColor(C.VERIF)
            .setDescription(`✅  ${target} removed from the **Sas List**.`)
            .setFooter(ft(client));
        return msg.reply({ embeds: [e] });
    },
};
