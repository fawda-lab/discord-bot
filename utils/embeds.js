const { EmbedBuilder } = require('discord.js');

function errEmbed(text) {
    return new EmbedBuilder().setColor(0xED4245).setDescription(`❌  ${text}`);
}

module.exports = { errEmbed };
