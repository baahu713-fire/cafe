const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authMiddleware, admin } = require('../middleware/authMiddleware');

// Public route: all authenticated users can view teams
router.get('/', authMiddleware, teamController.getAllTeams);
router.get('/:id', authMiddleware, teamController.getTeamById);

// Admin-only routes: only users with the 'admin' role can create, update, or delete teams
router.post('/', authMiddleware, admin, teamController.createTeam);
router.put('/:id', authMiddleware, admin, teamController.updateTeam);
router.delete('/:id', authMiddleware, admin, teamController.deleteTeam);

module.exports = router;
