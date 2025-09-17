const db = require('../config/database');

const getAllMenuItems = async () => {
    // Only fetch items that are not soft-deleted
    const { rows } = await db.query('SELECT * FROM menu_items WHERE deleted_from IS NULL ORDER BY name');
    return rows;
};

const getMenuItemById = async (itemId) => {
    const { rows } = await db.query('SELECT * FROM menu_items WHERE id = $1 AND deleted_from IS NULL', [itemId]);
    if (rows.length === 0) {
        throw new Error('Menu item not found');
    }
    return rows[0];
};

const createMenuItem = async (itemData) => {
    const { name, description, price, image, availability, proportions, available } = itemData;
    const { rows } = await db.query(
        'INSERT INTO menu_items (name, description, price, image, availability, proportions, available) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [name, description, price, image, availability, JSON.stringify(proportions), available]
    );
    return rows[0];
};

const updateMenuItem = async (itemId, itemData) => {
    const { name, description, price, image, availability, proportions, available } = itemData;
    const { rows } = await db.query(
        `UPDATE menu_items SET 
            name = $1, 
            description = $2, 
            price = $3, 
            image = $4, 
            availability = $5, 
            proportions = $6, 
            available = $7
        WHERE id = $8 AND deleted_from IS NULL RETURNING *`,
        [name, description, price, image, availability, JSON.stringify(proportions), available, itemId]
    );
    if (rows.length === 0) {
        throw new Error('Menu item not found or has been deleted');
    }
    return rows[0];
};

const softDeleteMenuItem = async (itemId) => {
    const { rows } = await db.query(
        'UPDATE menu_items SET deleted_from = NOW() WHERE id = $1 AND deleted_from IS NULL RETURNING id',
        [itemId]
    );
    if (rows.length === 0) {
        throw new Error('Menu item not found or already deleted');
    }
    return { message: 'Menu item soft-deleted successfully.' };
};

module.exports = {
    getAllMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    softDeleteMenuItem,
};
