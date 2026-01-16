const db = require('../config/database');

/**
 * Get all active CMC members ordered by display_order
 */
const getAllMembers = async () => {
    const query = `
        SELECT id, name, designation, phone, address, photo, display_order 
        FROM cmc_members 
        WHERE is_active = true 
        ORDER BY display_order ASC
    `;
    const { rows } = await db.query(query);
    return rows;
};

/**
 * Get a single CMC member by ID
 */
const getMemberById = async (id) => {
    const { rows } = await db.query(
        'SELECT id, name, designation, phone, address, photo FROM cmc_members WHERE id = $1 AND is_active = true',
        [id]
    );
    if (rows.length === 0) {
        throw new Error('CMC member not found');
    }
    return rows[0];
};

/**
 * Create a new CMC member
 */
const createMember = async (memberData) => {
    const { name, designation, phone, address, photo, display_order } = memberData;
    const { rows } = await db.query(
        `INSERT INTO cmc_members (name, designation, phone, address, photo, display_order) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [name, designation, phone, address, photo, display_order || 0]
    );
    return rows[0];
};

/**
 * Update a CMC member
 */
const updateMember = async (id, memberData) => {
    const { name, designation, phone, address, photo, display_order } = memberData;

    let query, params;

    if (photo) {
        query = `
            UPDATE cmc_members 
            SET name = $1, designation = $2, phone = $3, address = $4, photo = $5, display_order = $6
            WHERE id = $7 AND is_active = true 
            RETURNING *
        `;
        params = [name, designation, phone, address, photo, display_order || 0, id];
    } else {
        query = `
            UPDATE cmc_members 
            SET name = $1, designation = $2, phone = $3, address = $4, display_order = $5
            WHERE id = $6 AND is_active = true 
            RETURNING *
        `;
        params = [name, designation, phone, address, display_order || 0, id];
    }

    const { rows } = await db.query(query, params);
    if (rows.length === 0) {
        throw new Error('CMC member not found');
    }
    return rows[0];
};

/**
 * Soft delete a CMC member (set is_active to false)
 */
const deleteMember = async (id) => {
    const { rows } = await db.query(
        'UPDATE cmc_members SET is_active = false WHERE id = $1 RETURNING id',
        [id]
    );
    if (rows.length === 0) {
        throw new Error('CMC member not found');
    }
    return { message: 'CMC member deleted successfully' };
};

module.exports = {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember
};
