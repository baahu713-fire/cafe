const pool = require('../database/db');

/**
 * Service to create a new feedback entry in the database.
 * Ensures that the user submitting the feedback is the one who placed the order.
 */
const createFeedback = async ({ orderId, userId, rating, comment }) => {
    // First, verify that the order exists and belongs to the user trying to give feedback.
    const orderQuery = await pool.query(
        'SELECT id FROM orders WHERE id = $1 AND user_id = $2',
        [orderId, userId]
    );

    if (orderQuery.rows.length === 0) {
        throw new Error('Order not found or user is not authorized to give feedback for this order.');
    }

    // Now, insert the new feedback.
    // The UNIQUE constraint on order_id will prevent duplicate feedback.
    const feedbackQuery = await pool.query(
        'INSERT INTO feedback (order_id, rating, comment) VALUES ($1, $2, $3) RETURNING *',
        [orderId, rating, comment]
    );

    if (feedbackQuery.rows.length === 0) {
        throw new Error('Failed to save the feedback.');
    }

    return feedbackQuery.rows[0];
};

module.exports = {
    createFeedback,
};
