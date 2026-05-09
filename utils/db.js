const mongoose = require('mongoose');
const log = require('./logger')('Database');

module.exports = async function connectDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    log.info('Connected to MongoDB Atlas');
};
