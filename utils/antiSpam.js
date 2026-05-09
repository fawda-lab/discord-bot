const log = require('../logger')('AntiSpam');

const WINDOW_MS  = 3000;  // sliding window
const MSG_LIMIT  = 5;     // messages within window before action
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// userId → [timestamp, timestamp, ...]
const messageLog = new Map();

async function check(member) {
    if (!member || member.user.bot) return;

    const userId = member.id;
    const now    = Date.now();

    // get or init the timestamp list, pruning entries outside the window
    const timestamps = (messageLog.get(userId) ?? []).filter(t => now - t < WINDOW_MS);
    timestamps.push(now);
    messageLog.set(userId, timestamps);

    if (timestamps.length < MSG_LIMIT) return;

    // threshold hit — clear tracking and apply timeout
    messageLog.delete(userId);
    try {
        await member.timeout(TIMEOUT_MS, 'Auto: spam (5+ messages in 3s)');
        log.warn(`[AntiSpam] Timed out ${member.user.tag} (${userId}) for spam`);
    } catch (e) {
        log.error(`[AntiSpam] Could not timeout ${member.user.tag}:`, e.message);
    }
    return true;
}

module.exports = { check };
