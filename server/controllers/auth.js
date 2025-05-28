const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendMail = require('../utils/mailer');
const sendOtp = require("../utils/sendOtp");
const otpStore = {};

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            username,
            email,
            password,
            role: role || 'user'
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        await sendMail(
            email,
            "Welcome to Excel Analytics Platform",
            `<h3>Hello ${username},</h3><p>Thanks for Register with us.</p>`
        );

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not Found.' });
        }

        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = otp;
        await sendOtp(email, otp);

        // Return response that OTP is required
        return res.status(200).json({
            message: 'OTP sent to email',
            requiresOtp: true
        });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
    }
};


exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (otpStore[email] === otp) {
        delete otpStore[email];

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        await sendMail(
            email,
            "Welcome to Excel Analytics Platform",
            '<h3>Hello User </h3><p>Thanks for logging in with us.</p>'
        );

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    }

    return res.status(400).json({ success: false, message: "Invalid OTP" });
};




