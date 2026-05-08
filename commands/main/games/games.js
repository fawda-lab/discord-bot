const { EmbedBuilder } = require('discord.js');
const { ft, errEmbed } = require('../../../utils/mainHelpers');
const { C, PREFIX, GAME_ROLES, GAME_COOLDOWN } = require('../../../utils/mainConstants');

const GAME_MAP = {
    pes: 'pes', among: 'amongus', amongus: 'amongus',
    ff: 'freefire', freefire: 'freefire', codenames: 'codenames',
    lol: 'lol', valo: 'valorant', valorant: 'valorant',
    plato: 'plato', mc: 'minecraft', minecraft: 'minecraft',
    stumble: 'stumbleguys', stumbleguys: 'stumbleguys',
    brawl: 'brawlhalla', brawlhalla: 'brawlhalla',
    cs: 'csgo', roblox: 'roblox', pubg: 'pubg',
    parchisi: 'parchisi', fifa: 'fifa', gta: 'gta',
    cod: 'cod', fortnite: 'fortnite', monopoly: 'monopoly',
    bloodstrike: 'bloodstrike', chess: 'chess',
};

module.exports = {
    name: 'pes',
    aliases: [
        'among', 'amongus', 'ff', 'freefire', 'codenames', 'lol',
        'valo', 'valorant', 'plato', 'mc', 'minecraft', 'stumble', 'stumbleguys',
        'brawl', 'brawlhalla', 'cs', 'roblox', 'pubg', 'parchisi', 'fifa',
        'gta', 'cod', 'fortnite', 'monopoly', 'bloodstrike', 'chess',
    ],
    execute: async (msg, args, client) => {
        const { guild, member, channel } = msg;
        const gamecmd = msg.content.slice(PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
        const gameKey = GAME_MAP[gamecmd];
        const roleId  = GAME_ROLES[gameKey];
        if (!roleId || roleId === '0') return msg.reply({ embeds: [errEmbed('Game role not configured.')] });

        const coolKey   = `${channel.id}_${gameKey}`;
        const lastUsed  = client.gameCooldowns.get(coolKey) || 0;
        const remaining = GAME_COOLDOWN - (Date.now() - lastUsed);
        if (remaining > 0) {
            const mins = Math.ceil(remaining / 60000);
            return msg.reply({ embeds: [new EmbedBuilder().setColor(C.WARN)
                .setDescription(`⏳  Cooldown! Wait **${mins} min** before calling this game again.`)
                .setFooter(ft(client))] });
        }
        const role = guild.roles.cache.get(roleId);
        if (!role) return msg.reply({ embeds: [errEmbed('Game role not found.')] });
        client.gameCooldowns.set(coolKey, Date.now());
        return msg.reply(`🎮  ${role} — **${member.displayName}** is looking for players!`);
    },
};
