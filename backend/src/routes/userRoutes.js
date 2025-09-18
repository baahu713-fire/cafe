const express = require('express');
const router = express.Router();
const { getUsers, getAllUsers } = require('../controllers/userController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', authMiddleware, admin, getUsers);

// @route   GET /api/users/all
// @desc    Get all users for admin
// @access  Private/Admin
router.get('/all', authMiddleware, admin, getAllUsers);

module.exports = router;