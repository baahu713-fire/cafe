const menuService = require('../services/menuService');
const imageService = require('../services/imageService');

const getAllItems = async (req, res) => {
  try {
    const items = await menuService.getAllMenuItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all menu items for admin page (no category filtering)
 */
const getAllItemsAdmin = async (req, res) => {
  try {
    const items = await menuService.getAllMenuItemsAdmin();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getItemsByCategory = async (req, res) => {
  try {
    const items = await menuService.getMenuItemsByCategory(req.params.category);
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
    const itemData = req.body;

    // Upload image to MinIO if provided
    if (req.file) {
      const imageUrl = await imageService.uploadImage(
        req.file.buffer,
        'menu-items',
        req.file.originalname,
        req.file.mimetype
      );
      itemData.image = imageUrl;
    }

    if (itemData.proportions && typeof itemData.proportions === 'string') {
      itemData.proportions = JSON.parse(itemData.proportions);
    }
    // Parse schedulable boolean from FormData string
    if (typeof itemData.schedulable === 'string') {
      itemData.schedulable = itemData.schedulable === 'true';
    }

    // Backend validation for price and proportions
    if (itemData.proportions && itemData.proportions.length > 0) {
      const minProportionPrice = Math.min(...itemData.proportions.map(p => parseFloat(p.price)));
      if (parseFloat(itemData.price) !== minProportionPrice) {
        return res.status(400).json({ message: 'The item\'s main price must be equal to the smallest proportion price.' });
      }
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

    // Upload new image to MinIO if provided
    if (req.file) {
      // Delete old image if it exists
      const existingItem = await menuService.getMenuItemById(req.params.id);
      if (existingItem.image) {
        await imageService.deleteImage(existingItem.image);
      }

      const imageUrl = await imageService.uploadImage(
        req.file.buffer,
        'menu-items',
        req.file.originalname,
        req.file.mimetype
      );
      itemData.image = imageUrl;
    }

    if (itemData.proportions && typeof itemData.proportions === 'string') {
      itemData.proportions = JSON.parse(itemData.proportions);
    }
    // Parse schedulable boolean from FormData string
    if (typeof itemData.schedulable === 'string') {
      itemData.schedulable = itemData.schedulable === 'true';
    }

    // Backend validation for price and proportions
    if (itemData.proportions && itemData.proportions.length > 0) {
      const minProportionPrice = Math.min(...itemData.proportions.map(p => parseFloat(p.price)));
      if (parseFloat(itemData.price) !== minProportionPrice) {
        return res.status(400).json({ message: 'The item\'s main price must be equal to the smallest proportion price.' });
      }
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
  getAllItemsAdmin,
  getItemsByCategory,
  getItemById,
  createItem,
  updateItem,
  softDeleteItem,
};
