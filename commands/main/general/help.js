const { EmbedBuilder } = require('discord.js');
const { buildHelpRows } = require('../../../utils/helpPanels');
const { C } = require('../../../utils/mainConstants');

module.exports = {
    name: 'help',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        const e = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
            .setTitle('📖  FAWDA Bot — Command Panel')
            .setDescription('Select a category below to view its commands.\nClick **📨 Save to DM** to receive the full list in your DMs.')
            .setColor(C.VOICE)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setFooter({ text: `Requested by ${member.displayName}`, iconURL: member.user.displayAvatarURL() })
            .setTimestamp();
        return msg.reply({ embeds: [e], components: buildHelpRows() });
    },
};
