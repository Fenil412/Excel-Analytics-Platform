const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isUser } = require('../middleware/roleAuth');
const User = require('../models/User');

router.get('/profile', auth, isUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.put('/profile', auth, isUser, async (req, res) => {
    try {
        const { username, email } = req.body;

        const userFields = {};
        if (username) userFields.username = username;
        if (email) userFields.email = email;

        let user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: userFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
