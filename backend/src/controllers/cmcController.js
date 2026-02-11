const cmcService = require('../services/cmcService');
const imageService = require('../services/imageService');

const getAllMembers = async (req, res) => {
    try {
        const members = await cmcService.getAllMembers();
        // No more base64 conversion — photo_url is already a URL string
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMemberById = async (req, res) => {
    try {
        const member = await cmcService.getMemberById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createMember = async (req, res) => {
    try {
        const memberData = req.body;

        if (req.file) {
            const photoUrl = await imageService.uploadImage(
                req.file.buffer,
                'cmc-members',
                req.file.originalname,
                req.file.mimetype
            );
            memberData.photo_url = photoUrl;
        }

        const newMember = await cmcService.createMember(memberData);
        res.status(201).json(newMember);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateMember = async (req, res) => {
    try {
        const memberData = req.body;

        if (req.file) {
            // Delete old photo if exists
            const existingMember = await cmcService.getMemberById(req.params.id);
            if (existingMember && existingMember.photo_url) {
                await imageService.deleteImage(existingMember.photo_url);
            }

            const photoUrl = await imageService.uploadImage(
                req.file.buffer,
                'cmc-members',
                req.file.originalname,
                req.file.mimetype
            );
            memberData.photo_url = photoUrl;
        }

        const updatedMember = await cmcService.updateMember(req.params.id, memberData);
        if (!updatedMember) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json(updatedMember);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteMember = async (req, res) => {
    try {
        // Delete photo from MinIO before deleting the member
        const existingMember = await cmcService.getMemberById(req.params.id);
        if (existingMember && existingMember.photo_url) {
            await imageService.deleteImage(existingMember.photo_url);
        }

        const result = await cmcService.deleteMember(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember
};
