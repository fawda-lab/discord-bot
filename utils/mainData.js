const Member = require('./models/Member');

async function getMember(userId) {
    return Member.findByIdAndUpdate(
        userId,
        { $setOnInsert: { _id: userId } },
        { upsert: true, new: true }
    );
}

async function updateMember(userId, update) {
    return Member.findByIdAndUpdate(userId, update, { upsert: true, new: true });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { getMember, updateMember, sleep };
