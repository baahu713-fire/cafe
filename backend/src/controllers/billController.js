const billService = require('../services/billService');

/**
 * GET /api/bills/summary
 * Generate bill summary for a user within a date range.
 * Only includes SETTLED and DELIVERED orders with separate totals.
 */
const getBillSummary = async (req, res) => {
    try {
        const { startDate, endDate, userId: requestedUserId } = req.query;

        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                message: 'Both startDate and endDate are required (YYYY-MM-DD format)'
            });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            return res.status(400).json({
                message: 'Dates must be in YYYY-MM-DD format'
            });
        }

        // Check if startDate is before endDate
        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({
                message: 'startDate must be before or equal to endDate'
            });
        }

        // Determine which user's bill to fetch
        let targetUserId = req.session.user.id;

        // If a different userId is requested, check if user is admin
        if (requestedUserId && parseInt(requestedUserId) !== req.session.user.id) {
            const userRole = req.session.user.role;
            if (userRole !== 'admin' && userRole !== 'superadmin') {
                return res.status(403).json({
                    message: 'You can only view your own bill summary'
                });
            }
            targetUserId = parseInt(requestedUserId);
        }

        // Get user info for bill header
        const userInfo = await billService.getUserInfoForBill(targetUserId);

        // Generate bill summary
        const billSummary = await billService.generateBillSummary(
            targetUserId,
            startDate,
            endDate
        );

        res.json({
            user: userInfo,
            ...billSummary
        });

    } catch (error) {
        console.error('Error generating bill summary:', error);
        res.status(500).json({
            message: error.message || 'Failed to generate bill summary'
        });
    }
};

module.exports = {
    getBillSummary
};
