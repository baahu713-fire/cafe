const calendarService = require('../services/calendarService');

/**
 * POST /api/calendar/generate/:year
 * Generate all weekend holidays for a given year
 */
const generateYearCalendar = async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        if (!year || year < 2020 || year > 2100) {
            return res.status(400).json({ message: 'Invalid year. Must be between 2020 and 2100.' });
        }

        const createdBy = req.session.user.id;
        const result = await calendarService.generateYearWithWeekends(year, createdBy);

        res.status(201).json({
            message: `Calendar generated for ${year}. ${result.inserted} weekend days added.`,
            ...result
        });
    } catch (error) {
        console.error('Error generating year calendar:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/calendar/holidays
 * Get holidays filtered by year and optionally month
 */
const getHolidays = async (req, res) => {
    try {
        const year = parseInt(req.query.year);
        const month = req.query.month ? parseInt(req.query.month) : null;

        if (!year) {
            return res.status(400).json({ message: 'Year is required' });
        }

        const holidays = await calendarService.getHolidaysByYear(year, month);
        res.json(holidays);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/calendar/holidays
 * Add a single holiday
 */
const addHoliday = async (req, res) => {
    try {
        const { holiday_date, name, description } = req.body;

        if (!holiday_date || !name) {
            return res.status(400).json({ message: 'Holiday date and name are required' });
        }

        const date = new Date(holiday_date);
        const year = date.getFullYear();
        const createdBy = req.session.user.id;

        const holiday = await calendarService.addHoliday({
            year,
            holiday_date,
            name,
            description,
            created_by: createdBy
        });

        res.status(201).json(holiday);
    } catch (error) {
        console.error('Error adding holiday:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ message: 'A holiday already exists on this date' });
        }
        res.status(400).json({ message: error.message });
    }
};

/**
 * POST /api/calendar/holidays/bulk
 * Add multiple holidays at once
 */
const bulkAddHolidays = async (req, res) => {
    try {
        const { holidays, year } = req.body;

        if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
            return res.status(400).json({ message: 'Holidays array is required' });
        }

        if (!year) {
            return res.status(400).json({ message: 'Year is required' });
        }

        const createdBy = req.session.user.id;
        const result = await calendarService.bulkAddHolidays(holidays, year, createdBy);

        res.status(201).json({
            message: `${result.inserted} holidays added, ${result.skipped} skipped.`,
            ...result
        });
    } catch (error) {
        console.error('Error bulk adding holidays:', error);
        res.status(400).json({ message: error.message });
    }
};

/**
 * PUT /api/calendar/holidays/:id
 * Update a holiday
 */
const updateHoliday = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, description, holiday_date } = req.body;

        const holiday = await calendarService.updateHoliday(id, { name, description, holiday_date });
        res.json(holiday);
    } catch (error) {
        console.error('Error updating holiday:', error);
        res.status(400).json({ message: error.message });
    }
};

/**
 * DELETE /api/calendar/holidays/:id
 * Delete a holiday
 */
const deleteHoliday = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const holiday = await calendarService.deleteHoliday(id);
        res.json({ message: 'Holiday deleted', holiday });
    } catch (error) {
        console.error('Error deleting holiday:', error);
        res.status(400).json({ message: error.message });
    }
};

/**
 * DELETE /api/calendar/holidays/year/:year
 * Delete all holidays for a year
 */
const deleteHolidaysByYear = async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        if (!year) {
            return res.status(400).json({ message: 'Valid year is required' });
        }

        const deletedCount = await calendarService.deleteHolidaysByYear(year);
        res.json({ message: `${deletedCount} holidays deleted for year ${year}`, deletedCount });
    } catch (error) {
        console.error('Error deleting holidays by year:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    generateYearCalendar,
    getHolidays,
    addHoliday,
    bulkAddHolidays,
    updateHoliday,
    deleteHoliday,
    deleteHolidaysByYear
};
