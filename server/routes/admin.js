const express = require('express');
const router = express.Router();
const {admin, deleteUser, dashboard} = require('../controllers/admin');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleAuth');

router.get('/users', auth, isAdmin, admin);

router.delete('/users/:id', auth, isAdmin, deleteUser);

router.get('/dashboard', auth, isAdmin, dashboard);

module.exports = router;