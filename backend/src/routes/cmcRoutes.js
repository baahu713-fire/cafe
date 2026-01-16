const express = require('express');
const router = express.Router();
const cmcController = require('../controllers/cmcController');
const { authMiddleware, superadmin } = require('../middleware/authMiddleware');
const { uploads } = require('../middleware/upload');

// Public routes - Anyone can view CMC members
router.get('/', cmcController.getAllMembers);
router.get('/:id', cmcController.getMemberById);

// Superadmin-only routes - Only superadmin can manage CMC members
// Using uploads.cmcPhoto (500KB limit for CMC member photos)
router.post('/', authMiddleware, superadmin, uploads.cmcPhoto, cmcController.createMember);
router.put('/:id', authMiddleware, superadmin, uploads.cmcPhoto, cmcController.updateMember);
router.delete('/:id', authMiddleware, superadmin, cmcController.deleteMember);

module.exports = router;


