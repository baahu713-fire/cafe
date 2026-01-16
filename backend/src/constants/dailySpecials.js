/**
 * Days of the week constants for daily specials
 */
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Working days for daily specials (excludes Sunday)
 */
const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Daily special categories
 */
const DAILY_SPECIAL_CATEGORIES = {
    BREAKFAST: 'breakfast',
    LUNCH: 'lunch',
    SNACK: 'snack'
};

module.exports = {
    DAYS_OF_WEEK,
    WORKING_DAYS,
    DAILY_SPECIAL_CATEGORIES
};
