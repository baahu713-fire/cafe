const menuService = require('../services/menuService');

const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await menuService.getMenuItems();
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllMenuItems,
};
