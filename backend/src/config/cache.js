const { getRedisClient } = require('./redis');

const CACHE_TTL = 300; // 5 minutes in seconds

const CACHE_KEYS = {
    MENU_ALL: 'cache:menu:all',
    DAILY_SPECIALS_WEEKLY: 'cache:daily_specials:weekly',
    DAILY_SPECIALS_TODAY: 'cache:daily_specials:today'
};

/**
 * Get cached data from Redis
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Parsed data or null if not found
 */
const getCache = async (key) => {
    try {
        const client = await getRedisClient();
        if (!client) return null;

        const data = await client.get(key);
        if (data) {
            console.log(`[CACHE HIT] ${key}`);
            return JSON.parse(data);
        }
        console.log(`[CACHE MISS] ${key}`);
        return null;
    } catch (error) {
        console.error(`[CACHE ERROR] Failed to get ${key}:`, error.message);
        return null;
    }
};

/**
 * Set cached data in Redis
 * @param {string} key - Cache key
 * @param {any} data - Data to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 */
const setCache = async (key, data, ttl = CACHE_TTL) => {
    try {
        const client = await getRedisClient();
        if (!client) return;

        await client.set(key, JSON.stringify(data), { EX: ttl });
        console.log(`[CACHE SET] ${key} (TTL: ${ttl}s)`);
    } catch (error) {
        console.error(`[CACHE ERROR] Failed to set ${key}:`, error.message);
    }
};

/**
 * Invalidate (delete) cached data from Redis
 * @param {string|string[]} keys - Cache key(s) to invalidate
 */
const invalidateCache = async (keys) => {
    try {
        const client = await getRedisClient();
        if (!client) return;

        const keysArray = Array.isArray(keys) ? keys : [keys];
        for (const key of keysArray) {
            await client.del(key);
            console.log(`[CACHE INVALIDATE] ${key}`);
        }
    } catch (error) {
        console.error(`[CACHE ERROR] Failed to invalidate:`, error.message);
    }
};

/**
 * Invalidate all menu-related caches
 * Call this when menu items are created, updated, or deleted
 */
const invalidateMenuCache = async () => {
    await invalidateCache([
        CACHE_KEYS.MENU_ALL,
        CACHE_KEYS.DAILY_SPECIALS_WEEKLY,
        CACHE_KEYS.DAILY_SPECIALS_TODAY
    ]);
};

module.exports = {
    CACHE_KEYS,
    CACHE_TTL,
    getCache,
    setCache,
    invalidateCache,
    invalidateMenuCache
};
