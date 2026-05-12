const { EmbedBuilder } = require('discord.js');
const { RANKS } = require('../../utils/constants');

module.exports = {
    name: 'help',
    aliases: ['rankhelp'],
    execute: async (msg, args, client) => {
        const rankList = RANKS.map(r => `\`Lv.${r.level}\` ${r.name}`).join('\n');
        const e = new EmbedBuilder()
            .setTitle('📊  FAWDA Rank Bot — All Commands')
            .setColor(0xFFD700)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: '👤  Member',
                    value: [
                        '`.rank` — Affiche ta carte de rang',
                        '`.rank @user` — Carte d\'un autre membre',
                        '`.lb` — Classement top 10 XP',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '🛡️  Staff / Admin',
                    value: [
                        '`.givexp @user [n]` — Donner des XP',
                        '`.resetxp @user` — Remettre les XP à 0',
                    ].join('\n'),
                    inline: false,
                },
                {
                    name: '⚡  Comment gagner des XP',
                    value: '💬 **Messages** — 15 à 25 XP par message (cooldown 60s)\n🔊 **Vocal** — 10 XP par minute passée en vocal',
                    inline: false,
                },
                {
                    name: '🏆  Paliers de rang',
                    value: rankList,
                    inline: true,
                },
                {
                    name: '🎨  Couleur de carte',
                    value: 'La couleur change selon ton rang actuel',
                    inline: true,
                },
            )
            .setFooter({ text: 'Préfixe : .  •  Owner = Level 9999 ∞' })
            .setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
