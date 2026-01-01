const express = require('express');
const router = express.Router();
const { getUsers, getAllUsers, getActiveUsers, getUserPhoto, updateUserProfile, getUserProfile } = require('../controllers/userController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

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

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, getUserProfile);

// @route   GET /api/users/:userId/photo
// @desc    Get user photo
// @access  Private
router.get('/:userId/photo', authMiddleware, getUserPhoto);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, upload, updateUserProfile);

module.exports = router;
