// Local DNS servers may refuse SRV queries from Node's c-ares resolver — use Google DNS
require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const log = require('../logger')('Database');

module.exports = async function connectDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    log.info('Connected to MongoDB Atlas');
};
