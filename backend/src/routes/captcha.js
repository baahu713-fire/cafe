const express = require('express');
const router = express.Router();
const captchaController = require('../controllers/captchaController');

// Route to generate a new CAPTCHA
// GET /api/generate-captcha
router.get('/generate-captcha', captchaController.getCaptcha);

// Route to validate the user's CAPTCHA input
// POST /api/validate-captcha
router.post('/validate-captcha', captchaController.postValidateCaptcha);

module.exports = router;
