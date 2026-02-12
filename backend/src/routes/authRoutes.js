const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { uploads } = require('../middleware/upload');

router.post('/register', uploads.userPhoto, authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;