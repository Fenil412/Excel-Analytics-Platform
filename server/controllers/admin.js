const User = require('../models/User');

exports.admin = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const result = await User.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.dashboard = async (req, res) => {
    try {
        const userCount = await User.countDocuments();

        res.json({
            userCount,
            message: 'Admin access granted'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};