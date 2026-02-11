const db = require('../config/database');

/**
 * Get menu items for the Menu page (public).
 * Only items where category is NULL or not in ('breakfast', 'lunch') are shown.
 * Excludes image_data bytea column — images are served via MinIO URLs in the 'image' column.
 */
const getAllMenuItems = async () => {
    const { rows } = await db.query(
        `SELECT id, name, description, price, image, availability, proportions, 
                created_at, deleted_from, available, category, day_of_week, schedulable
         FROM menu_items 
         WHERE deleted_from IS NULL 
         AND (category IS NULL OR category NOT IN ('breakfast', 'lunch'))
         ORDER BY name`
    );
    return rows;
};

/**
 * Get ALL menu items for Admin page (no category filtering).
 * Excludes image_data bytea column.
 */
const getAllMenuItemsAdmin = async () => {
    const { rows } = await db.query(
        `SELECT id, name, description, price, image, availability, proportions, 
                created_at, deleted_from, available, category, day_of_week, schedulable
         FROM menu_items 
         WHERE deleted_from IS NULL 
         ORDER BY name`
    );
    return rows;
};

const getMenuItemsByCategory = async (category) => {
    const { rows } = await db.query(
        `SELECT id, name, description, price, image, availability, proportions, 
                created_at, deleted_from, available, category, day_of_week, schedulable
         FROM menu_items 
         WHERE $1 = ANY(availability) AND deleted_from IS NULL 
         ORDER BY name`,
        [category]
    );
    return rows;
};

const getMenuItemById = async (itemId) => {
    const { rows } = await db.query(
        `SELECT id, name, description, price, image, availability, proportions, 
                created_at, deleted_from, available, category, day_of_week, schedulable
         FROM menu_items 
         WHERE id = $1 AND deleted_from IS NULL`,
        [itemId]
    );
    if (rows.length === 0) {
        throw new Error('Menu item not found');
    }
    return rows[0];
};

const createMenuItem = async (itemData) => {
    const { name, description, price, image, availability, proportions, available, category, day_of_week, schedulable } = itemData;

    const { rows: existing } = await db.query('SELECT id FROM menu_items WHERE name = $1 AND deleted_from IS NULL', [name]);
    if (existing.length > 0) {
        throw new Error('A menu item with this name already exists.');
    }

    const { rows } = await db.query(
        'INSERT INTO menu_items (name, description, price, image, availability, proportions, available, category, day_of_week, schedulable) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [name, description, price, image || null, availability, JSON.stringify(proportions), available, category || null, day_of_week || null, schedulable || false]
    );
    return rows[0];
};

const updateMenuItem = async (itemId, itemData) => {
    const { name, description, price, image, availability, proportions, available, category, day_of_week, schedulable } = itemData;

    // Cast itemId to integer for proper comparison
    const id = parseInt(itemId, 10);

    const { rows: existing } = await db.query('SELECT id FROM menu_items WHERE name = $1 AND id != $2 AND deleted_from IS NULL', [name, id]);

    if (existing.length > 0) {
        throw new Error('A menu item with this name already exists.');
    }

    const queryParams = [
        name,
        description,
        price,
        availability,
        JSON.stringify(proportions),
        available,
        category || null,
        day_of_week || null,
        schedulable || false
    ];

    let updateQuery = `
        UPDATE menu_items 
        SET name = $1, 
            description = $2, 
            price = $3, 
            availability = $4, 
            proportions = $5, 
            available = $6,
            category = $7,
            day_of_week = $8,
            schedulable = $9
    `;

    if (image) {
        updateQuery += ', image = $10';
        queryParams.push(image);
        queryParams.push(id);
        updateQuery += ' WHERE id = $11 RETURNING *';
    } else {
        queryParams.push(id);
        updateQuery += ' WHERE id = $10 RETURNING *';
    }

    const { rows } = await db.query(updateQuery, queryParams);

    if (rows.length === 0) {
        throw new Error('Menu item not found or has been deleted');
    }
    return rows[0];
};

const softDeleteMenuItem = async (itemId) => {
    const { rows } = await db.query(
        'UPDATE menu_items SET deleted_from = NOW(), available = false WHERE id = $1 AND deleted_from IS NULL RETURNING id',
        [itemId]
    );
    if (rows.length === 0) {
        throw new Error('Menu item not found or already deleted');
    }
    return { message: 'Menu item soft-deleted successfully.' };
};

module.exports = {
    getAllMenuItems,
    getAllMenuItemsAdmin,
    getMenuItemsByCategory,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    softDeleteMenuItem,
};
