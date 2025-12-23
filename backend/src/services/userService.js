const db = require('../config/database');
const ORDER_STATUS = require('../constants/orderStatus');
const bcrypt = require('bcryptjs');

const buildQuery = (baseQuery, page, limit, search, searchFields, isOrderQuery = false) => {
    const offset = (page - 1) * limit;
    const params = [];
    const whereClauses = [];

    if (isOrderQuery) {
        whereClauses.push('o.status = $1');
        params.push(ORDER_STATUS.DELIVERED);
    }

    if (search && searchFields.length > 0) {
        const searchClauses = searchFields.map(field => {
            params.push(`%${search}%`);
            return `${field} ILIKE $${params.length}`;
        });
        whereClauses.push(`(${searchClauses.join(' OR ')})`);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const totalQuery = `SELECT COUNT(*) FROM ${isOrderQuery ? 'users u JOIN orders o ON u.id = o.user_id' : 'users'} ${whereString}`;
    
    params.push(limit, offset);
    const limitOffsetString = `LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const mainQuery = `${baseQuery} ${whereString} ${isOrderQuery ? 'GROUP BY u.id' : ''} ORDER BY created_at DESC ${limitOffsetString}`;

    return { totalQuery, mainQuery, params };
};

const getAllUsers = async (page, limit, search = '') => {
    const baseQuery = 'SELECT id, username, role, created_at FROM users';
    const { totalQuery, mainQuery, params } = buildQuery(baseQuery, page, limit, search, ['username']);
    
    const totalResult = await db.query(totalQuery, params.slice(0, params.length - 2));
    const total = parseInt(totalResult.rows[0].count, 10);

    const { rows: users } = await db.query(mainQuery, params);

    return { users, total };
};

const getUsersWithOrderStats = async (page, limit, search = '') => {
    const baseQuery = `
        SELECT
            u.id,
            u.username,
            u.role,
            u.created_at,
            COUNT(o.id) AS order_count,
            SUM(o.total_price) AS total_order_price
        FROM users u
        JOIN orders o ON u.id = o.user_id
    `;

    const { totalQuery, mainQuery, params } = buildQuery(baseQuery, page, limit, search, ['u.username'], true);
    
    const totalResult = await db.query(totalQuery, params.slice(0, params.length - 2));
    const total = parseInt(totalResult.rows[0].count, 10);

    const { rows: users } = await db.query(mainQuery, params);

    return { users, total };
};

const getActiveUsers = async () => {
    const { rows } = await db.query('SELECT u.id, u.username, u.role, t.name as team_name FROM users u LEFT JOIN teams t ON u.team_id = t.id WHERE u.is_active = TRUE ORDER BY u.username ASC');
    return rows;
};

const getUserPhoto = async (userId) => {
    const result = await db.query('SELECT photo FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0) {
        return result.rows[0].photo;
    }
    return null;
};

const updateUserProfile = async (userId, { name, password, photo }) => {
    const setClauses = [];
    const params = [userId];

    if (name) {
        params.push(name);
        setClauses.push(`name = $${params.length}`);
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        params.push(hashedPassword);
        setClauses.push(`hashed_password = $${params.length}`);
    }

    if (photo) {
        params.push(photo);
        setClauses.push(`photo = $${params.length}`);
    }

    if (setClauses.length === 0) {
        throw new Error('No fields to update.');
    }

    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $1 RETURNING id, name, username, role, team_id, is_active`;

    const { rows: [updatedUser] } = await db.query(query, params);

    if (!updatedUser) {
        throw new Error('User not found.');
    }

    return updatedUser;
};

const getUserProfile = async (userId) => {
    const { rows } = await db.query('SELECT id, name, username, role, team_id, is_active FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) {
        throw new Error('User not found');
    }
    return rows[0];
};

module.exports = {
    getAllUsers,
    getUsersWithOrderStats,
    getActiveUsers,
    getUserPhoto,
    updateUserProfile,
    getUserProfile
};