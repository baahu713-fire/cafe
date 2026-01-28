const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * GET /api/bills/summary
 * Get bill summary for a user within a date range.
 * Query params: startDate, endDate, userId (optional, admin only)
 * Regular users can only view their own bill.
 */
router.get('/summary', authMiddleware, billController.getBillSummary);

module.exports = router;
