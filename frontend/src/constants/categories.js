export const CATEGORIES = [
    'Starters',
    'Main Course',
    'Desserts',
    'Beverages',
    'Salads',
    'Soups',
];

export const AVAILABILITY_OPTIONS = [
    'All',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snacks',
    'Beverages',
];

// Daily Specials categories (for menu_items.category column)
export const DAILY_SPECIAL_CATEGORIES = [
    { value: '', label: 'None (Regular Menu Item)' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'snack', label: 'Snack' },
];

// Days of the week for daily specials
export const DAYS_OF_WEEK = [
    { value: '', label: 'Everyday' },
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
];
