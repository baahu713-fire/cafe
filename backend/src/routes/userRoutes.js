const express = require('express');
const router = express.Router();
const { getUsers, getAllUsers, getActiveUsers } = require('../controllers/userController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', authMiddleware, admin, getUsers);

// @route   GET /api/users/all
// @desc    Get all users for admin
// @access  Private/Admin
router.get('/all', authMiddleware, admin, getAllUsers);

// @route   GET /api/users/active
// @desc    Get all active users for admin order placement
// @access  Private/Admin
router.get('/active', authMiddleware, admin, getActiveUsers);

module.exports = router;