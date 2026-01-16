const express = require('express');
const router = express.Router();
const dailySpecialsController = require('../controllers/dailySpecialsController');

router.get('/', dailySpecialsController.getDailySpecials);

module.exports = router;
