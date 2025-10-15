const menuService = require('../services/menuService');

const getAllItems = async (req, res) => {
  try {
    const items = await menuService.getAllMenuItems();
    const itemsWithImages = items.map(item => {
      if (item.image_data) {
        item.image_data = `data:image/jpeg;base64,${Buffer.from(item.image_data).toString('base64')}`;
      }
      return item;
    });
    res.json(itemsWithImages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getItemById = async (req, res) => {
  try {
    const item = await menuService.getMenuItemById(req.params.id);
     if (item.image_data) {
        item.image_data = `data:image/jpeg;base64,${Buffer.from(item.image_data).toString('base64')}`;
      }
    res.json(item);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const createItem = async (req, res) => {
  try {
    const itemData = req.body;
    if (req.file) {
      itemData.image_data = req.file.buffer;
    }
    if (itemData.proportions && typeof itemData.proportions === 'string') {
      itemData.proportions = JSON.parse(itemData.proportions);
    }
    const newItem = await menuService.createMenuItem(itemData);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const itemData = req.body;
    if (req.file) {
      itemData.image_data = req.file.buffer;
    }
    if (itemData.proportions && typeof itemData.proportions === 'string') {
      itemData.proportions = JSON.parse(itemData.proportions);
    }
    const updatedItem = await menuService.updateMenuItem(req.params.id, itemData);
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
