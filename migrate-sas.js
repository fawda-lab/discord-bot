require('dotenv').config();
require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Member   = require('./utils/models/Member');

async function migrateSas() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Find all docs that still have the old isSas field set to true
    const legacy = await Member.find({ isSas: true }).select('_id').lean();
    console.log(`Found ${legacy.length} legacy isSas:true documents`);

    if (legacy.length === 0) {
        console.log('Nothing to migrate.');
        await mongoose.disconnect();
        return;
    }

    const now = new Date().toISOString();
    const ops = legacy.map(doc => ({
        updateOne: {
            filter: { _id: doc._id },
            update: {
                $set:   { sas: { active: true, by: 'UNKNOWN', at: now } },
                $unset: { isSas: '' },
            },
        },
    }));

    const result = await Member.bulkWrite(ops, { ordered: false });
    console.log(`Migration complete:`);
    console.log(`  Updated: ${result.modifiedCount}`);

    await mongoose.disconnect();
}

migrateSas().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
