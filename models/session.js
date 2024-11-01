// models/Session.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now, expires: '1h' }, // Session expires after 1 hour
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
