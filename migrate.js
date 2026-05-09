require('dotenv').config();
// Local DNS servers sometimes refuse SRV queries from Node's c-ares resolver;
// use Google's public DNS to ensure the mongodb+srv:// lookup works.
require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const fs       = require('fs');
const path     = require('path');
const mongoose = require('mongoose');
const Member   = require('./utils/models/Member');

const RANK_FILE = path.join(__dirname, 'rank_data.json');
const MAIN_FILE = path.join(__dirname, 'data.json');

function loadJSON(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
    catch (e) { console.error(`Failed to parse ${filePath}:`, e.message); return null; }
}

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const rankData = loadJSON(RANK_FILE) ?? { users: {} };
    const mainData = loadJSON(MAIN_FILE) ?? { warns: {}, jailed: {}, sasList: [], verifications: {}, jailActions: {} };

    // Collect every user ID seen across both files
    const allIds = new Set([
        ...Object.keys(rankData.users ?? {}),
        ...Object.keys(mainData.warns  ?? {}),
        ...Object.keys(mainData.jailed ?? {}),
        ...(mainData.sasList ?? []),
        ...Object.keys(mainData.verifications ?? {}),
        ...Object.keys(mainData.jailActions   ?? {}),
    ]);

    console.log(`Found ${allIds.size} unique users to migrate`);

    const ops = [];

    for (const id of allIds) {
        const rankUser = rankData.users?.[id] ?? {};
        const warnData = mainData.warns?.[id];
        const jailData = mainData.jailed?.[id];

        // warns[id].reasons is the array written by warn.js
        const warns = (warnData?.reasons ?? []).map(w => ({
            reason: w.reason ?? 'No reason provided',
            by:     w.by     ?? 'unknown',
            at:     w.at     ?? new Date().toISOString(),
        }));

        const jail = jailData ? {
            reason:        jailData.reason        ?? 'No reason provided',
            jailedBy:      jailData.jailedBy      ?? 'unknown',
            timestamp:     jailData.timestamp     ?? new Date().toISOString(),
            rolesSnapshot: jailData.rolesSnapshot ?? [],
        } : null;

        const isSas = (mainData.sasList ?? []).includes(id);

        const staffStats = {
            verificationsDone: mainData.verifications?.[id] ?? 0,
            jailsDone:         mainData.jailActions?.[id]   ?? 0,
        };

        ops.push({
            updateOne: {
                filter: { _id: id },
                update: {
                    $set: {
                        xp:         rankUser.xp      ?? 0,
                        lastMsg:    rankUser.lastMsg  ?? 0,
                        warns,
                        jail,
                        isSas,
                        staffStats,
                    },
                },
                upsert: true,
            },
        });
    }

    if (ops.length === 0) {
        console.log('No data to migrate.');
        await mongoose.disconnect();
        return;
    }

    const result = await Member.bulkWrite(ops, { ordered: false });
    console.log(`Migration complete:`);
    console.log(`  Inserted: ${result.upsertedCount}`);
    console.log(`  Updated:  ${result.modifiedCount}`);
    console.log(`  Total:    ${result.upsertedCount + result.modifiedCount}`);

    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
