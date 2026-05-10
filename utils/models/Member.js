const { Schema, model } = require('mongoose');

const warnSchema = new Schema({
    reason: { type: String, required: true },
    by:     { type: String, required: true },
    at:     { type: String, required: true },
}, { _id: false });

const jailSchema = new Schema({
    reason:        { type: String, required: true },
    jailedBy:      { type: String, required: true },
    timestamp:     { type: String, required: true },
    rolesSnapshot: { type: [String], default: [] },
}, { _id: false });

const staffStatsSchema = new Schema({
    verificationsDone: { type: Number, default: 0 },
    jailsDone:         { type: Number, default: 0 },
}, { _id: false });

const timeoutLogSchema = new Schema({
    reason:   { type: String, required: true },
    by:       { type: String, required: true },
    at:       { type: String, required: true },
    duration: { type: String, required: true },
}, { _id: false });

const memberSchema = new Schema({
    _id:        { type: String, required: true },
    xp:             { type: Number, default: 0 },
    voiceXp:        { type: Number, default: 0 },
    lastMsg:        { type: Number, default: 0 },
    lastDailyClaim: { type: Number, default: 0 },
    warns:      { type: [warnSchema], default: [] },
    jail:       { type: jailSchema,  default: null },
    isSas:      { type: Boolean, default: false },
    staffStats: { type: staffStatsSchema, default: () => ({ verificationsDone: 0, jailsDone: 0 }) },
    timeouts:   { type: [timeoutLogSchema], default: [] },
});

module.exports = model('Member', memberSchema);
