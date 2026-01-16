const cmcService = require('../services/cmcService');

/**
 * Get all CMC members
 */
const getAllMembers = async (req, res) => {
    try {
        const members = await cmcService.getAllMembers();

        // Convert photo binary to base64 for frontend
        const membersWithPhotos = members.map(member => {
            if (member.photo) {
                member.photo = `data:image/jpeg;base64,${Buffer.from(member.photo).toString('base64')}`;
            }
            return member;
        });

        res.json(membersWithPhotos);
    } catch (error) {
        console.error('Error fetching CMC members:', error);
        res.status(500).json({ error: 'Failed to fetch CMC members' });
    }
};

/**
 * Get a single CMC member by ID
 */
const getMemberById = async (req, res) => {
    try {
        const member = await cmcService.getMemberById(req.params.id);

        if (member.photo) {
            member.photo = `data:image/jpeg;base64,${Buffer.from(member.photo).toString('base64')}`;
        }

        res.json(member);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

/**
 * Create a new CMC member (Admin only)
 */
const createMember = async (req, res) => {
    try {
        const memberData = req.body;
        if (req.file) {
            memberData.photo = req.file.buffer;
        }

        const newMember = await cmcService.createMember(memberData);
        res.status(201).json(newMember);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update a CMC member (Admin only)
 */
const updateMember = async (req, res) => {
    try {
        const memberData = req.body;
        if (req.file) {
            memberData.photo = req.file.buffer;
        }

        const updatedMember = await cmcService.updateMember(req.params.id, memberData);
        res.json(updatedMember);
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete a CMC member (Admin only)
 */
const deleteMember = async (req, res) => {
    try {
        await cmcService.deleteMember(req.params.id);
        res.json({ message: 'CMC member deleted successfully' });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember
};
