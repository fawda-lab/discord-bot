const fs  = require('fs');
const log = require('../logger')('MainBot');
const { DATA_FILE } = require('./mainConstants');

function loadData() {
    if (!fs.existsSync(DATA_FILE))
        return { warns: {}, jailed: {}, sasList: [], verifications: {}, jailActions: {} };
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch (e) {
        log.error('[Data] Failed to parse data.json:', e.message);
        return { warns: {}, jailed: {}, sasList: [], verifications: {}, jailActions: {} };
    }
}

function saveData(d) {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(d, null, 2), 'utf8');
    fs.renameSync(tmp, DATA_FILE);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { loadData, saveData, sleep };
