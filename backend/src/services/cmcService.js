const db = require('../config/database');

/**
 * Get all CMC members. Uses photo_url instead of photo bytea.
 */
const getAllMembers = async () => {
    const { rows } = await db.query(
        'SELECT id, name, designation, phone, address, photo_url, display_order, is_active, created_at FROM cmc_members ORDER BY display_order ASC, created_at ASC'
    );
    return rows;
};

const getMemberById = async (id) => {
    const { rows } = await db.query(
        'SELECT id, name, designation, phone, address, photo_url, display_order, is_active, created_at FROM cmc_members WHERE id = $1',
        [id]
    );
    return rows[0] || null;
};

const createMember = async ({ name, designation, phone, address, photo_url, display_order }) => {
    const { rows } = await db.query(
        'INSERT INTO cmc_members (name, designation, phone, address, photo_url, display_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, designation, phone, address, photo_url || null, display_order || 0]
    );
    return rows[0];
};

const updateMember = async (id, { name, designation, phone, address, photo_url, display_order }) => {
    const setClauses = ['name = $2', 'designation = $3', 'phone = $4', 'address = $5'];
    const params = [id, name, designation, phone, address];

    if (photo_url) {
        params.push(photo_url);
        setClauses.push(`photo_url = $${params.length}`);
    }

    if (display_order !== undefined) {
        params.push(display_order);
        setClauses.push(`display_order = $${params.length}`);
    }

    const { rows } = await db.query(
        `UPDATE cmc_members SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        params
    );
    return rows[0] || null;
};

const deleteMember = async (id) => {
    const { rows } = await db.query(
        'DELETE FROM cmc_members WHERE id = $1 RETURNING id',
        [id]
    );
    return rows[0] || null;
};

module.exports = {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
};
