const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Public routes for viewing menu items
router.get('/', menuController.getAllItems);
router.get('/category/:category', menuController.getItemsByCategory);

// Admin route for getting ALL menu items (no category filtering)
// Must be BEFORE /:id to prevent 'admin' being matched as an id
router.get('/admin/all', authMiddleware, admin, menuController.getAllItemsAdmin);

// This must come AFTER /admin/all
router.get('/:id', menuController.getItemById);

// Admin-only routes for modifying menu items
router.post('/', authMiddleware, admin, upload.single('image'), menuController.createItem);
router.put('/:id', authMiddleware, admin, upload.single('image'), menuController.updateItem);
router.delete('/:id', authMiddleware, admin, menuController.softDeleteItem);

module.exports = router;

