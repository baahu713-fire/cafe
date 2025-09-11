const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const authMiddleware = require('../middleware/authMiddleware'); // General authentication
const adminMiddleware = require('../middleware/adminMiddleware'); // Role-based access

// Public route: all authenticated users can view teams
router.get('/', authMiddleware, teamController.getAllTeams);
router.get('/:id', authMiddleware, teamController.getTeamById);

// Admin-only routes: only users with the 'admin' role can create, update, or delete teams
router.post('/', authMiddleware, adminMiddleware, teamController.createTeam);
router.put('/:id', authMiddleware, adminMiddleware, teamController.updateTeam);
router.delete('/:id', authMiddleware, adminMiddleware, teamController.deleteTeam);

module.exports = router;
