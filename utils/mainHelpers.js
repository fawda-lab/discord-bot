const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { C, ROLES, JAILER_ROLES } = require('./mainConstants');

function ft(client) {
    return { text: 'FAWDA Bot', iconURL: client.user.displayAvatarURL() };
}

function errEmbed(text) {
    return new EmbedBuilder().setColor(C.ERROR).setDescription(`❌  ${text}`);
}

function warnBar(count) {
    const filled = Math.min(count, 3);
    return '🟥'.repeat(filled) + '⬜'.repeat(3 - filled);
}

function warnColor(count) {
    if (count >= 3) return C.JAIL;
    if (count === 2) return 0xFF7043;
    return C.WARN;
}

const MEDALS = ['🥇', '🥈', '🥉'];
function rankMedal(i) { return MEDALS[i] ?? `**${i + 1}.**`; }

function hasStaffPerms(member) {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    if (ROLES.STAFF && ROLES.STAFF !== '0') return member.roles.cache.has(ROLES.STAFF);
    return member.permissions.has(PermissionFlagsBits.ManageMessages);
}

function hasJailPerms(member) {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    return JAILER_ROLES.some(id => member.roles.cache.has(id));
}

function hasVerifPerms(member) {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    if (ROLES.STAFF && member.roles.cache.has(ROLES.STAFF)) return true;
    if (ROLES.VERIF && member.roles.cache.has(ROLES.VERIF)) return true;
    return false;
}

async function resolveUser(guild, raw) {
    if (!raw) return null;
    const id = raw.replace(/[<@!>]/g, '');
    return guild.members.fetch(id).catch(() => null);
}

module.exports = { ft, errEmbed, warnBar, warnColor, rankMedal, hasStaffPerms, hasJailPerms, hasVerifPerms, resolveUser };
