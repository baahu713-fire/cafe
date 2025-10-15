const db = require('../config/database');

const getAllMenuItems = async () => {
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
    const { name, description, price, image_data, availability, proportions, available } = itemData;

    const { rows: existing } = await db.query('SELECT id FROM menu_items WHERE name = $1 AND deleted_from IS NULL', [name]);
    if (existing.length > 0) {
        throw new Error('A menu item with this name already exists.');
    }

    const { rows } = await db.query(
        'INSERT INTO menu_items (name, description, price, image_data, availability, proportions, available) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [name, description, price, image_data, availability, JSON.stringify(proportions), available]
    );
    return rows[0];
};

const updateMenuItem = async (itemId, itemData) => {
    const { name, description, price, image_data, availability, proportions, available } = itemData;

    const { rows: existing } = await db.query('SELECT id FROM menu_items WHERE name = $1 AND id != $2 AND deleted_from IS NULL', [name, itemId]);
    if (existing.length > 0) {
        throw new Error('A menu item with this name already exists.');
    }

    const queryParams = [
        name,
        description,
        price,
        availability,
        JSON.stringify(proportions),
        available
    ];

    let updateQuery = `
        UPDATE menu_items 
        SET name = $1, 
            description = $2, 
            price = $3, 
            availability = $4, 
            proportions = $5, 
            available = $6
    `;

    if (image_data) {
        updateQuery += ', image_data = $7';
        queryParams.push(image_data);
        queryParams.push(itemId);
        updateQuery += ' WHERE id = $8 RETURNING *';
    } else {
        queryParams.push(itemId);
        updateQuery += ' WHERE id = $7 RETURNING *';
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
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    softDeleteMenuItem,
};
