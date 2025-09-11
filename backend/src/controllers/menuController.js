const menuService = require('../services/menuService');

const getAllItems = async (req, res) => {
  try {
    const items = await menuService.getAllMenuItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getItemById = async (req, res) => {
  try {
    const item = await menuService.getMenuItemById(req.params.id);
    res.json(item);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const createItem = async (req, res) => {
  try {
    const newItem = await menuService.createMenuItem(req.body);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const updatedItem = await menuService.updateMenuItem(req.params.id, req.body);
    res.json(updatedItem);
  } catch (error) {
    if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const softDeleteItem = async (req, res) => {
  try {
    await menuService.softDeleteMenuItem(req.params.id);
    res.status(200).json({ message: 'Menu item successfully deleted.' });
  } catch (error) {
    if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  softDeleteItem,
};
