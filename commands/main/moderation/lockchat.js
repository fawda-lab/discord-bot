const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const log = require('../../../logger')('MainBot');
const { ft, errEmbed, hasEventOrModeratorPerms } = require('../../../utils/mainHelpers');
const { C, LOG_CHANNELS } = require('../../../utils/mainConstants');

const LOCKED_CHAT_PERMISSIONS = {
    SendMessages: false,
    SendMessagesInThreads: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
};

function fieldValue(value) {
    return value.length > 1024 ? `${value.slice(0, 1021)}...` : value;
}

module.exports = {
    name: 'lockchat',
    aliases: ['lock'],
    execute: async (msg, args, client) => {
        const { guild, member, channel } = msg;
        if (!hasEventOrModeratorPerms(member)) {
            return msg.reply({ embeds: [errEmbed('No permission. Event Hoster, Event Manager, or Moderator+ only.')] });
        }

        if (!channel.permissionOverwrites?.edit) {
            return msg.reply({ embeds: [errEmbed('This channel cannot be locked with this command.')] });
        }

        const botMember = guild.members.me ?? await guild.members.fetchMe();
        const botPerms = channel.permissionsFor(botMember);
        if (!botPerms?.has(PermissionFlagsBits.ManageChannels)) {
            return msg.reply({ embeds: [errEmbed(`I am missing Manage Channels permission in ${channel}.`)] });
        }

        const everyone = guild.roles.everyone;
        const current = channel.permissionOverwrites.cache.get(everyone.id);
        if (current?.deny.has(PermissionFlagsBits.SendMessages)) {
            return msg.reply({ embeds: [errEmbed(`${channel} is already locked.`)] });
        }

        const reason = args.join(' ') || 'No reason provided';
        const auditReason = `lockchat by ${member.user.tag}: ${reason}`.slice(0, 512);

        await channel.permissionOverwrites.edit(everyone, LOCKED_CHAT_PERMISSIONS, { reason: auditReason });

        const e = new EmbedBuilder()
            .setTitle('Chat Locked')
            .setColor(C.JAIL)
            .addFields(
                { name: 'Channel', value: `${channel}`, inline: true },
                { name: 'By', value: `${member}`, inline: true },
                { name: 'Reason', value: fieldValue(reason), inline: false },
            )
            .setFooter(ft(client))
            .setTimestamp();
        await msg.reply({ embeds: [e] });

        const logCh = await guild.channels.fetch(LOG_CHANNELS.ALL).catch(() => null);
        if (logCh) await logCh.send({ embeds: [e] }).catch(error => log.error('[LockChatLog]', error.message));
    },
};
