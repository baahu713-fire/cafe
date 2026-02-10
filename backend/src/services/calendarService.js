const db = require('../config/database');

/**
 * Generate all Saturdays and Sundays for a given year as holidays
 * @param {number} year 
 * @param {number} createdBy - User ID of superadmin
 * @returns {Promise<Object>} { inserted: number, skipped: number }
 */
const generateYearWithWeekends = async (year, createdBy) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Delete existing weekend entries for this year so regeneration always starts clean
        await client.query(
            `DELETE FROM holiday_calendar WHERE year = $1 AND is_weekend = true`,
            [year]
        );

        let inserted = 0;
        let skipped = 0;

        const startDate = new Date(year, 0, 1); // Jan 1
        const endDate = new Date(year, 11, 31); // Dec 31

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay(); // 0=Sunday, 6=Saturday
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                // Use local date methods to avoid UTC timezone shift from toISOString()
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const dayName = dayOfWeek === 0 ? 'Sunday' : 'Saturday';

                try {
                    await client.query(
                        `INSERT INTO holiday_calendar (year, holiday_date, name, is_weekend, created_by)
                         VALUES ($1, $2, $3, true, $4)
                         ON CONFLICT (holiday_date) DO NOTHING`,
                        [year, dateStr, dayName, createdBy]
                    );
                    inserted++;
                } catch (err) {
                    // Skip duplicate dates
                    skipped++;
                }
            }
        }

        await client.query('COMMIT');
        return { inserted, skipped };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get holidays for a specific year, optionally filtered by month
 * @param {number} year 
 * @param {number} [month] - 1-12, optional
 * @returns {Promise<Array>}
 */
const getHolidaysByYear = async (year, month) => {
    let query = `SELECT * FROM holiday_calendar WHERE year = $1`;
    const params = [year];

    if (month) {
        query += ` AND EXTRACT(MONTH FROM holiday_date) = $2`;
        params.push(month);
    }

    query += ` ORDER BY holiday_date ASC`;

    const { rows } = await db.query(query, params);
    return rows;
};

/**
 * Get holidays within a date range (used by scheduled order integration)
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
const getHolidaysByDateRange = async (startDate, endDate) => {
    const { rows } = await db.query(
        `SELECT holiday_date FROM holiday_calendar 
         WHERE holiday_date >= $1 AND holiday_date <= $2
         ORDER BY holiday_date ASC`,
        [startDate, endDate]
    );
    return rows;
};

/**
 * Check if a specific date is a holiday
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<boolean>}
 */
const isHoliday = async (date) => {
    const { rows } = await db.query(
        `SELECT id FROM holiday_calendar WHERE holiday_date = $1 LIMIT 1`,
        [date]
    );
    return rows.length > 0;
};

/**
 * Add a single holiday
 * @param {Object} data - { year, holiday_date, name, description, created_by }
 * @returns {Promise<Object>}
 */
const addHoliday = async (data) => {
    const { year, holiday_date, name, description, created_by } = data;
    const { rows } = await db.query(
        `INSERT INTO holiday_calendar (year, holiday_date, name, description, is_weekend, created_by)
         VALUES ($1, $2, $3, $4, false, $5)
         RETURNING *`,
        [year, holiday_date, name, description || null, created_by]
    );
    return rows[0];
};

/**
 * Update a holiday
 * @param {number} id 
 * @param {Object} data - { name, description, holiday_date }
 * @returns {Promise<Object>}
 */
const updateHoliday = async (id, data) => {
    const { name, description, holiday_date } = data;
    const { rows } = await db.query(
        `UPDATE holiday_calendar 
         SET name = COALESCE($1, name), 
             description = COALESCE($2, description),
             holiday_date = COALESCE($3, holiday_date)
         WHERE id = $4
         RETURNING *`,
        [name, description, holiday_date, id]
    );
    if (rows.length === 0) {
        throw new Error('Holiday not found');
    }
    return rows[0];
};

/**
 * Delete a holiday
 * @param {number} id 
 * @returns {Promise<Object>}
 */
const deleteHoliday = async (id) => {
    const { rows } = await db.query(
        `DELETE FROM holiday_calendar WHERE id = $1 RETURNING *`,
        [id]
    );
    if (rows.length === 0) {
        throw new Error('Holiday not found');
    }
    return rows[0];
};

/**
 * Bulk add holidays
 * @param {Array} holidays - Array of { holiday_date, name, description }
 * @param {number} year
 * @param {number} createdBy
 * @returns {Promise<Object>} { inserted, skipped }
 */
const bulkAddHolidays = async (holidays, year, createdBy) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        let inserted = 0;
        let skipped = 0;

        for (const holiday of holidays) {
            try {
                await client.query(
                    `INSERT INTO holiday_calendar (year, holiday_date, name, description, is_weekend, created_by)
                     VALUES ($1, $2, $3, $4, false, $5)
                     ON CONFLICT (holiday_date) DO NOTHING`,
                    [year, holiday.holiday_date, holiday.name, holiday.description || null, createdBy]
                );
                inserted++;
            } catch (err) {
                skipped++;
            }
        }

        await client.query('COMMIT');
        return { inserted, skipped };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Delete all holidays for a specific year (used when regenerating)
 * @param {number} year
 * @returns {Promise<number>} Number of deleted rows
 */
const deleteHolidaysByYear = async (year) => {
    const { rowCount } = await db.query(
        `DELETE FROM holiday_calendar WHERE year = $1`,
        [year]
    );
    return rowCount;
};

/**
 * Check if a date is a weekend (Saturday=6 or Sunday=0)
 * This is used as a fallback when no calendar has been generated yet
 * @param {Date} date 
 * @returns {boolean}
 */
const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

module.exports = {
    generateYearWithWeekends,
    getHolidaysByYear,
    getHolidaysByDateRange,
    isHoliday,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    bulkAddHolidays,
    deleteHolidaysByYear,
    isWeekend
};
