const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/userController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', authMiddleware, admin, getUsers);

module.exports = router;