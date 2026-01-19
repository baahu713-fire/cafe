import { useState, useEffect, useCallback } from 'react';
import { getTimeSlotStatus } from '../services/timeSlotService';

/**
 * Hook to manage time slot status with polling
 * @param {number} pollIntervalMs - How often to refresh status (default: 30 seconds)
 */
const useTimeSlots = (pollIntervalMs = 30000) => {
    const [timeSlots, setTimeSlots] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStatus = useCallback(async () => {
        try {
            const status = await getTimeSlotStatus();
            setTimeSlots(status);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch time slot status:', err);
            setError('Failed to load ordering times');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();

        // Poll for updates
        const interval = setInterval(fetchStatus, pollIntervalMs);

        return () => clearInterval(interval);
    }, [fetchStatus, pollIntervalMs]);

    /**
     * Check if a category is currently available for ordering
     * @param {string} category - 'breakfast', 'lunch', 'snack', or 'snacks'
     */
    const isAvailable = useCallback((category) => {
        if (!timeSlots || !category) return true; // Allow if status unknown

        const normalizedCategory = category.toLowerCase();
        const slotInfo = timeSlots[normalizedCategory === 'snacks' ? 'snack' : normalizedCategory];

        return slotInfo?.isActive ?? true;
    }, [timeSlots]);

    /**
     * Get display info for a category's time slot
     * @param {string} category - 'breakfast', 'lunch', 'snack'
     */
    const getSlotInfo = useCallback((category) => {
        if (!timeSlots || !category) return null;

        const normalizedCategory = category.toLowerCase();
        return timeSlots[normalizedCategory === 'snacks' ? 'snack' : normalizedCategory] || null;
    }, [timeSlots]);

    /**
     * Format countdown string from minutes
     */
    const formatCountdown = useCallback((minutes) => {
        if (!minutes || minutes <= 0) return '';

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }, []);

    return {
        timeSlots,
        loading,
        error,
        isAvailable,
        getSlotInfo,
        formatCountdown,
        nextAvailableSlot: timeSlots?.nextAvailableSlot,
        currentTimeIST: timeSlots?.currentTimeFormatted,
        refresh: fetchStatus
    };
};

export default useTimeSlots;
