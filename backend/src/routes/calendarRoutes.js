const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authMiddleware, superadmin } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/calendar/generate/:year
 * @desc    Generate weekend holidays for a year
 * @access  Superadmin
 */
router.post('/generate/:year', authMiddleware, superadmin, calendarController.generateYearCalendar);

/**
 * @route   GET /api/calendar/holidays/public
 * @desc    Get holidays (query: year, month) - accessible by any authenticated user
 * @access  Authenticated
 */
router.get('/holidays/public', authMiddleware, calendarController.getHolidays);

/**
 * @route   GET /api/calendar/holidays
 * @desc    Get holidays (query: year, month)
 * @access  Superadmin
 */
router.get('/holidays', authMiddleware, superadmin, calendarController.getHolidays);

/**
 * @route   POST /api/calendar/holidays/bulk
 * @desc    Bulk add holidays
 * @access  Superadmin
 */
router.post('/holidays/bulk', authMiddleware, superadmin, calendarController.bulkAddHolidays);

/**
 * @route   POST /api/calendar/holidays
 * @desc    Add a single holiday
 * @access  Superadmin
 */
router.post('/holidays', authMiddleware, superadmin, calendarController.addHoliday);

/**
 * @route   PUT /api/calendar/holidays/:id
 * @desc    Update a holiday
 * @access  Superadmin
 */
router.put('/holidays/:id', authMiddleware, superadmin, calendarController.updateHoliday);

/**
 * @route   DELETE /api/calendar/holidays/year/:year
 * @desc    Delete all holidays for a year
 * @access  Superadmin
 */
router.delete('/holidays/year/:year', authMiddleware, superadmin, calendarController.deleteHolidaysByYear);

/**
 * @route   DELETE /api/calendar/holidays/:id
 * @desc    Delete a holiday
 * @access  Superadmin
 */
router.delete('/holidays/:id', authMiddleware, superadmin, calendarController.deleteHoliday);

module.exports = router;
