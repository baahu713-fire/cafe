const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes for viewing menu items
router.get('/', menuController.getAllItems);
router.get('/:id', menuController.getItemById);

// Admin-only routes for modifying menu items
router.post('/', authMiddleware, adminMiddleware, menuController.createItem);
router.put('/:id', authMiddleware, adminMiddleware, menuController.updateItem);
router.delete('/:id', authMiddleware, adminMiddleware, menuController.softDeleteItem);

module.exports = router;
