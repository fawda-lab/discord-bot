const { EmbedBuilder } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasStaffPerms, resolveUser } = require('../../../utils/mainHelpers');
const { C } = require('../../../utils/mainConstants');

const UNIT_MAP = { s: 1000, m: 60_000, h: 3_600_000 };

module.exports = {
    name: 'vmute',
    execute: async (msg, args, client) => {
        const { guild, member } = msg;
        if (!hasStaffPerms(member)) return msg.reply({ embeds: [errEmbed('No permission.')] });
        const target = await resolveUser(guild, args[0]);
        if (!target) return msg.reply({ embeds: [errEmbed('Member not found.')] });
        if (!target.voice?.channel)
            return msg.reply({ embeds: [errEmbed(`${target} is not in a voice channel.`)] });
        const timeArg = args[1];
        if (!timeArg) return msg.reply({ embeds: [errEmbed('Usage: `!vmute @user [time]` — e.g. `5m`, `30s`')] });
        const match = timeArg.match(/^(\d+)(s|m|h)?$/i);
        if (!match) return msg.reply({ embeds: [errEmbed('Invalid duration. Ex: `30s` `5m` `1h`')] });
        const ms = parseInt(match[1]) * UNIT_MAP[(match[2] || 'm').toLowerCase()];

        await target.voice.setMute(true, `Voice muted by ${member.user.tag}`);

        const e = new EmbedBuilder().setColor(C.MUTED)
            .setDescription(`🔇  ${target} voice-muted for **${timeArg}**.`)
            .setFooter(ft(client));
        await msg.reply({ embeds: [e] });

        setTimeout(async () => {
            if (target.voice?.channel) {
                await target.voice.setMute(false, 'vmute expired').catch(e => log.debug('[DEBUG]', e.message));
            }
        }, ms);
    },
};
