const log    = require('../logger')('RankBot');
const Member = require('./models/Member');
const { RANKS } = require('./constants');

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

async function getMember(userId) {
    return Member.findByIdAndUpdate(
        userId,
        { $setOnInsert: { _id: userId } },
        { upsert: true, new: true }
    );
}

async function addXP(userId, amount, guild) {
    const before = await getMember(userId);
    const oldLevel = calcLevel(before.xp).level;

    const after = await Member.findByIdAndUpdate(
        userId,
        { $inc: { xp: amount } },
        { new: true }
    );

    if (calcLevel(after.xp).level > oldLevel) {
        await handleRankUp(userId, oldLevel, calcLevel(after.xp).level, guild);
    }
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

async function getMainBotData() {
    const doc = await Member.findById('__main__').catch(() => null);
    return doc;
}

module.exports = { getMember, addXP, calcLevel, getRankName, getMainBotData };
