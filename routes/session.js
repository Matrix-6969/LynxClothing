// routes/session.js
const express = require('express');
const Session = require('../models/session');
const User = require('../models/user');

const router = express.Router();

// Get User Profile Route (via session)
router.get('/profile', async (req, res) => {
    const { userId } = req.session; // Assuming userId is stored in the session

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await User.findById(userId).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
