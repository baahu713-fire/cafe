const db = require('../config/database');

const getMenuItems = async () => {
  const { rows } = await db.query('SELECT * FROM menu_items');
  return rows;
};

module.exports = {
  getMenuItems,
};
