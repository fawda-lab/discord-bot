const { EmbedBuilder } = require('discord.js');
const Member = require('../../utils/models/Member');
const { getMember, addXP } = require('../../utils/dataManager');

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const XP_MIN = 50, XP_MAX = 150;

module.exports = {
    name: 'daily',
    aliases: ['claim'],
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        const doc = await getMember(member.id);
        const now  = Date.now();
        const last = doc.lastDailyClaim ?? 0;
        const remaining = COOLDOWN_MS - (now - last);

        if (remaining > 0) {
            const hours   = Math.floor(remaining / 3_600_000);
            const minutes = Math.floor((remaining % 3_600_000) / 60_000);
            const e = new EmbedBuilder()
                .setColor(0xEB459E)
                .setTitle('🎁 Daily Reward')
                .setDescription(`You already claimed your daily reward!\nCome back in **${hours}h ${minutes}m**.`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            return msg.reply({ embeds: [e] });
        }

        const gain = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
        await addXP(member.id, gain, guild);
        await Member.findByIdAndUpdate(member.id, { $set: { lastDailyClaim: now } });

        const e = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('🎁 Daily Reward')
            .setDescription(`**+${gain} XP** added to your profile!`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Come back in 24h for your next reward!' })
            .setTimestamp();
        return msg.reply({ embeds: [e] });
    },
};
