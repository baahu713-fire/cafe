const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

/**
 * GET /api/bills/summary
 * Get bill summary for a user within a date range.
 * Query params: startDate, endDate, userId (optional, admin only)
 * Regular users can only view their own bill.
 */
router.get('/summary', authMiddleware, billController.getBillSummary);

/**
 * GET /api/bills/all-users
 * Get bill summary for all users within a date range (Admin only)
 * Query params: startDate, endDate, userId (optional - filter to specific user)
 */
router.get('/all-users', authMiddleware, admin, billController.getAllUsersBills);

/**
 * GET /api/bills/export-csv
 * Export bills as CSV file (Admin only)
 * Query params: startDate, endDate, userId (optional)
 */
router.get('/export-csv', authMiddleware, admin, billController.exportBillsCSV);

module.exports = router;
