const express = require('express');
const router = express.Router();
const {
    getUsers,
    getAllUsers,
    getAllUsersForSuperAdmin,
    getActiveUsers,
    getUserPhoto,
    updateUserProfile,
    getUserProfile,
    updateUserStatus,
    updateUserBySuperAdmin,
    changeUserPasswordBySuperAdmin
} = require('../controllers/userController');
const { authMiddleware, admin, superadmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const { uploads } = require('../middleware/upload');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', authMiddleware, admin, getUsers);

// @route   GET /api/users/all
// @desc    Get all users for admin
// @access  Private/Superadmin
router.get('/all', authMiddleware, superadmin, getAllUsersForSuperAdmin);

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
router.put('/profile', authMiddleware, uploads.userPhoto, updateUserProfile);

// @route   PATCH /api/users/:userId/status
// @desc    Update user status
// @access  Private/Superadmin
router.patch('/:userId/status', authMiddleware, superadmin, updateUserStatus);

// @route   PATCH /api/users/:userId/details
// @desc    Update user details by superadmin
// @access  Private/Superadmin
router.patch('/:userId/details', authMiddleware, superadmin, uploads.userPhoto, updateUserBySuperAdmin);

// @route   PATCH /api/users/:userId/password
// @desc    Change user password by superadmin
// @access  Private/Superadmin
router.patch('/:userId/password', authMiddleware, superadmin, changeUserPasswordBySuperAdmin);

module.exports = router;
