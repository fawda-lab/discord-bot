const fs   = require('fs');
const path = require('path');
const log  = require('../logger')('RankBot');
const { DATA_FILE, RANKS } = require('./constants');

function loadData() {
    if (!fs.existsSync(DATA_FILE)) return { users: {} };
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch { return { users: {} }; }
}

function saveData(d) {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(d, null, 2), 'utf8');
    fs.renameSync(tmp, DATA_FILE);
}

function getMainBotData() {
    try {
        const p = path.join(__dirname, '..', 'data.json');
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) { log.debug('[DEBUG]', e.message); }
    return null;
}

function xpToNextLevel(n) { return 200 * (n + 1); }

function calcLevel(totalXP) {
    if (totalXP < 0) totalXP = 0;
    let level = 0, spent = 0;
    while (true) {
        const needed = xpToNextLevel(level);
        if (spent + needed > totalXP) return { level, currentXP: totalXP - spent, neededXP: needed, totalXP };
        spent += needed;
        level++;
    }
}

function getRankName(level) {
    const r = [...RANKS].reverse().find(r => level >= r.level);
    return r ? r.name : 'Initiate';
}

async function addXP(userId, amount, guild) {
    const data = loadData();
    if (!data.users[userId]) data.users[userId] = { xp: 0, lastMsg: 0 };
    const oldLevel = calcLevel(data.users[userId].xp).level;
    data.users[userId].xp += amount;
    const newInfo  = calcLevel(data.users[userId].xp);
    saveData(data);
    if (newInfo.level > oldLevel) await handleRankUp(userId, oldLevel, newInfo.level, guild);
}

async function handleRankUp(userId, oldLevel, newLevel, guild) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    let milestone = null;
    for (const rank of RANKS) {
        if (newLevel >= rank.level && oldLevel < rank.level) milestone = rank;
    }
    if (!milestone) return;

    for (const rank of RANKS) {
        if (member.roles.cache.has(rank.id))
            await member.roles.remove(rank.id).catch(e => log.debug('[DEBUG]', e.message));
    }
    const role = guild.roles.cache.get(milestone.id);
    if (role) await member.roles.add(role).catch(e => log.debug('[DEBUG]', e.message));

    await member.send(
        `🎉 You reached **Level ${newLevel}** in **FAWDA**!\n` +
        `You unlocked the rank **${milestone.name}**! Congrats!`
    ).catch(e => log.debug('[DEBUG]', e.message));
}

module.exports = { loadData, saveData, getMainBotData, calcLevel, getRankName, addXP };
