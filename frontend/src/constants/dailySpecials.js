/**
 * Days of the week constants for daily specials
 * Matches backend constants/dailySpecials.js
 */
export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Working days for daily specials (excludes Sunday)
 */
export const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Daily special categories
 */
export const DAILY_SPECIAL_CATEGORIES = {
    BREAKFAST: 'breakfast',
    LUNCH: 'lunch',
    SNACK: 'snack'
};

/**
 * Get current day name
 * @returns {string} Current day name (e.g., 'Sunday', 'Monday')
 */
export const getCurrentDayName = () => DAYS_OF_WEEK[new Date().getDay()];
