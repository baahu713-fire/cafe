const express = require('express');
const router = express.Router();
const { getTimeSlotStatus, getNextAvailableSlot, isWithinTimeSlot } = require('../constants/timeSlots');

/**
 * GET /api/time-slots
 * Returns current status of all ordering time slots
 */
router.get('/', (req, res) => {
    try {
        const status = getTimeSlotStatus();
        const nextSlot = getNextAvailableSlot();

        res.json({
            ...status,
            nextAvailableSlot: nextSlot
        });
    } catch (error) {
        console.error('Error fetching time slot status:', error);
        res.status(500).json({ error: 'Failed to fetch time slot status' });
    }
});

/**
 * GET /api/time-slots/check/:category
 * Check if a specific category is currently available for ordering
 */
router.get('/check/:category', (req, res) => {
    try {
        const { category } = req.params;
        const isAvailable = isWithinTimeSlot(category);
        const status = getTimeSlotStatus();
        const slotInfo = status[category.toLowerCase()] || null;

        res.json({
            category,
            isAvailable,
            slotInfo,
            currentTimeIST: status.currentTimeFormatted
        });
    } catch (error) {
        console.error('Error checking time slot:', error);
        res.status(500).json({ error: 'Failed to check time slot' });
    }
});

module.exports = router;
