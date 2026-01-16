const dailySpecialsService = require('../services/dailySpecialsService');

/**
 * Convert binary image_data to base64 data URL for frontend consumption
 */
const convertItemImages = (items) => {
    return items.map(item => {
        if (item.image_data) {
            item.image_data = `data:image/jpeg;base64,${Buffer.from(item.image_data).toString('base64')}`;
        }
        return item;
    });
};

const getDailySpecials = async (req, res) => {
    try {
        const { type } = req.query;

        if (type === 'weekly') {
            const weeklyMenu = await dailySpecialsService.getWeeklySpecials();
            // Convert images for each day's categories
            Object.keys(weeklyMenu).forEach(day => {
                weeklyMenu[day].breakfast = convertItemImages(weeklyMenu[day].breakfast);
                weeklyMenu[day].lunch = convertItemImages(weeklyMenu[day].lunch);
                weeklyMenu[day].snack = convertItemImages(weeklyMenu[day].snack);
            });
            return res.json(weeklyMenu);
        }

        // Default: Today's specials
        const todayMenu = await dailySpecialsService.getTodaySpecials();
        todayMenu.breakfast = convertItemImages(todayMenu.breakfast);
        todayMenu.lunch = convertItemImages(todayMenu.lunch);
        todayMenu.snack = convertItemImages(todayMenu.snack);
        res.json(todayMenu);
    } catch (error) {
        console.error('Error fetching daily specials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getDailySpecials
};


