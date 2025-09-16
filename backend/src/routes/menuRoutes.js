const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

// Public routes for viewing menu items
router.get('/', menuController.getAllItems);
router.get('/:id', menuController.getItemById);

// Admin-only routes for modifying menu items
router.post('/', authMiddleware, admin, menuController.createItem);
router.put('/:id', authMiddleware, admin, menuController.updateItem);
router.delete('/:id', authMiddleware, admin, menuController.softDeleteItem);

module.exports = router;
