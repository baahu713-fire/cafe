const db = require('../config/database');

const createOrder = async (orderData) => {
  const { userId, items, totalAmount } = orderData;
  const { rows } = await db.query(
    'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING id',
    [userId, totalAmount]
  );
  const orderId = rows[0].id;

  for (const item of items) {
    await db.query(
      'INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES ($1, $2, $3)',
      [orderId, item.id, item.quantity]
    );
  }

  return { orderId, ...orderData };
};

const getOrderHistory = async (userId) => {
  const { rows } = await db.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
  return rows;
};

module.exports = {
  createOrder,
  getOrderHistory,
};
