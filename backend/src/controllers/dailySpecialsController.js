const dailySpecialsService = require('../services/dailySpecialsService');

/**
 * Get daily specials — images are now URLs from MinIO, no conversion needed.
 */
const getDailySpecials = async (req, res) => {
    try {
        const { type } = req.query;

        if (type === 'weekly') {
            const weeklyMenu = await dailySpecialsService.getWeeklySpecials();
            return res.json(weeklyMenu);
        }

        // Default: Today's specials
        const todayMenu = await dailySpecialsService.getTodaySpecials();
        res.json(todayMenu);
    } catch (error) {
        console.error('Error fetching daily specials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getDailySpecials
};
