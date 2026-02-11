const db = require('../config/database');
const { DAYS_OF_WEEK, WORKING_DAYS, DAILY_SPECIAL_CATEGORIES } = require('../constants/dailySpecials');

/**
 * Fetches all daily special items from menu_items for the full week.
 * Excludes image_data bytea column — images are served via MinIO URLs in the 'image' column.
 * @returns {Object} Weekly menu organized by day and category.
 */
const getWeeklySpecials = async () => {
    const query = `
        SELECT id, name, description, price, image, availability, proportions, 
               created_at, deleted_from, available, category, day_of_week, schedulable
        FROM menu_items 
        WHERE category IS NOT NULL 
        AND available = true 
        AND deleted_from IS NULL
    `;
    const { rows } = await db.query(query);

    const weeklyMenu = {};

    WORKING_DAYS.forEach(day => {
        weeklyMenu[day] = {
            [DAILY_SPECIAL_CATEGORIES.BREAKFAST]: [],
            [DAILY_SPECIAL_CATEGORIES.LUNCH]: [],
            [DAILY_SPECIAL_CATEGORIES.SNACK]: []
        };
    });

    rows.forEach(item => {
        if (!item.day_of_week) {
            WORKING_DAYS.forEach(day => {
                if (weeklyMenu[day][item.category]) {
                    weeklyMenu[day][item.category].push(item);
                }
            });
        } else if (weeklyMenu[item.day_of_week]) {
            if (weeklyMenu[item.day_of_week][item.category]) {
                weeklyMenu[item.day_of_week][item.category].push(item);
            }
        }
    });

    return weeklyMenu;
};

/**
 * Fetches daily special items for the current day.
 * @returns {Object} Today's menu organized by category.
 */
const getTodaySpecials = async () => {
    const today = new Date();
    const currentDay = DAYS_OF_WEEK[today.getDay()];

    const query = `
        SELECT id, name, description, price, image, availability, proportions, 
               created_at, deleted_from, available, category, day_of_week, schedulable
        FROM menu_items 
        WHERE category IS NOT NULL 
        AND available = true 
        AND deleted_from IS NULL
        AND (
            day_of_week IS NULL 
            OR day_of_week = $1
        )
    `;

    const { rows } = await db.query(query, [currentDay]);

    const breakfast = rows.filter(item => item.category === DAILY_SPECIAL_CATEGORIES.BREAKFAST);
    const lunch = rows.filter(item => item.category === DAILY_SPECIAL_CATEGORIES.LUNCH);
    const snack = rows.filter(item => item.category === DAILY_SPECIAL_CATEGORIES.SNACK);

    return {
        breakfast,
        lunch,
        snack
    };
};

module.exports = {
    getWeeklySpecials,
    getTodaySpecials
};
