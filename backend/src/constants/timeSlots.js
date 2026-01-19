/**
 * Time slots for ordering food items (IST - Indian Standard Time)
 * All times are in 24-hour format
 * 
 * SECURITY: Uses server start time + elapsed time calculation to prevent
 * users from bypassing time restrictions by changing system time.
 */

const TIME_SLOTS = {
    breakfast: {
        start: '08:00',
        end: '09:45',
        displayStart: '8:00 AM',
        displayEnd: '9:45 AM'
    },
    lunch: {
        start: '11:00',
        end: '12:30',
        displayStart: '11:00 AM',
        displayEnd: '12:30 PM'
    },
    snack: {
        start: '15:00',
        end: '15:45',
        displayStart: '3:00 PM',
        displayEnd: '3:45 PM'
    },
    // 'snacks' is an alias for 'snack' (both terms used in the codebase)
    snacks: {
        start: '15:00',
        end: '15:45',
        displayStart: '3:00 PM',
        displayEnd: '3:45 PM'
    }
};

// IST offset in hours from UTC
const IST_OFFSET_HOURS = 5.5;

/**
 * SECURITY: Capture server start time to detect time manipulation.
 * We record both the timestamp and process.hrtime() at server start.
 * Later, we use hrtime() (monotonic clock) to calculate actual elapsed time.
 */
const SERVER_START_TIME = Date.now();
const SERVER_START_HRTIME = process.hrtime.bigint();

/**
 * Get current time using monotonic clock (immune to system time changes)
 * This uses process.hrtime() which is not affected by system clock changes.
 * @returns {Date} Current time calculated from server start + elapsed time
 */
const getTrustedCurrentTime = () => {
    // Calculate nanoseconds elapsed since server start
    const elapsedNs = process.hrtime.bigint() - SERVER_START_HRTIME;
    // Convert to milliseconds
    const elapsedMs = Number(elapsedNs / BigInt(1000000));
    // Calculate current time based on server start time + elapsed
    return new Date(SERVER_START_TIME + elapsedMs);
};

/**
 * Get current time in IST using trusted (monotonic) time source
 * @returns {Date} Current time adjusted to IST
 */
const getCurrentTimeIST = () => {
    const now = getTrustedCurrentTime();
    // Get UTC time and add IST offset
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + (IST_OFFSET_HOURS * 3600000));
    return istTime;
};

/**
 * Check if current time is within a given time slot
 * @param {string} category - 'breakfast', 'lunch', or 'snack'/'snacks'
 * @returns {boolean} True if within time slot
 */
const isWithinTimeSlot = (category) => {
    const slot = TIME_SLOTS[category?.toLowerCase()];
    if (!slot) return true; // If no slot defined, allow ordering

    const now = getCurrentTimeIST();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHours * 60 + currentMinutes; // Convert to minutes

    const [startHour, startMin] = slot.start.split(':').map(Number);
    const [endHour, endMin] = slot.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
};

/**
 * Get the status of all time slots
 * @returns {Object} Status of each category
 */
const getTimeSlotStatus = () => {
    const now = getCurrentTimeIST();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHours * 60 + currentMinutes;

    const getSlotInfo = (category) => {
        const slot = TIME_SLOTS[category];
        const [startHour, startMin] = slot.start.split(':').map(Number);
        const [endHour, endMin] = slot.end.split(':').map(Number);

        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        const isActive = currentTime >= startTime && currentTime <= endTime;
        let minutesUntilStart = null;
        let minutesUntilEnd = null;

        if (currentTime < startTime) {
            minutesUntilStart = startTime - currentTime;
        } else if (isActive) {
            minutesUntilEnd = endTime - currentTime;
        }

        return {
            isActive,
            start: slot.start,
            end: slot.end,
            displayStart: slot.displayStart,
            displayEnd: slot.displayEnd,
            minutesUntilStart,
            minutesUntilEnd
        };
    };

    return {
        currentTimeIST: now.toISOString(),
        currentTimeFormatted: now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }),
        breakfast: getSlotInfo('breakfast'),
        lunch: getSlotInfo('lunch'),
        snack: getSlotInfo('snack')
    };
};

/**
 * Get next available time slot
 * @returns {Object} Next available slot info
 */
const getNextAvailableSlot = () => {
    const now = getCurrentTimeIST();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHours * 60 + currentMinutes;

    const slots = [
        { name: 'breakfast', ...TIME_SLOTS.breakfast },
        { name: 'lunch', ...TIME_SLOTS.lunch },
        { name: 'snack', ...TIME_SLOTS.snack }
    ];

    // Find next slot that starts after current time today
    for (const slot of slots) {
        const [startHour, startMin] = slot.start.split(':').map(Number);
        const startTime = startHour * 60 + startMin;

        if (currentTime < startTime) {
            return {
                category: slot.name,
                displayStart: slot.displayStart,
                displayEnd: slot.displayEnd,
                minutesUntil: startTime - currentTime
            };
        }
    }

    // All slots passed today, return breakfast for tomorrow
    const breakfastStart = 8 * 60; // 8:00 AM
    const minutesUntilMidnight = (24 * 60) - currentTime;
    const minutesUntilBreakfast = minutesUntilMidnight + breakfastStart;

    return {
        category: 'breakfast',
        displayStart: TIME_SLOTS.breakfast.displayStart,
        displayEnd: TIME_SLOTS.breakfast.displayEnd,
        minutesUntil: minutesUntilBreakfast,
        isTomorrow: true
    };
};

module.exports = {
    TIME_SLOTS,
    IST_OFFSET_HOURS,
    getCurrentTimeIST,
    getTrustedCurrentTime,
    isWithinTimeSlot,
    getTimeSlotStatus,
    getNextAvailableSlot
};
