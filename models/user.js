// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Add any other user fields as needed
});

const User = mongoose.model('User', userSchema);
module.exports = User;
