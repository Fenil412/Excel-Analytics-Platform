const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isUser } = require('../middleware/roleAuth');
const {profile, profileUpdate} = require('../controllers/user');

router.get('/profile', auth, isUser, profile);

router.put('/profile', auth, isUser, profileUpdate);

module.exports = router;
