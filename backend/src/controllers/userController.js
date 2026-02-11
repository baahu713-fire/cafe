const userService = require('../services/userService');
const imageService = require('../services/imageService');

const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const search = req.query.search || '';
        const data = await userService.getUsersWithOrderStats(page, limit, search);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const getAllUsers = async (req, res, next) => {
    // This should be protected and only accessible by superadmin
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 1000; // A large limit to get all users
        const search = req.query.search || '';
        const data = await userService.getAllUsers(page, limit, search);
        res.json(data.users);
    } catch (error) {
        next(error);
    }
};

const getAllUsersForSuperAdmin = async (req, res, next) => {
    try {
        const search = req.query.search || '';
        const users = await userService.getAllUsersForSuperAdmin(search);
        res.json(users);
    } catch (error) {
        next(error);
    }
};

const getActiveUsers = async (req, res, next) => {
    try {
        const users = await userService.getActiveUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
};

const getUserPhoto = async (req, res) => {
    const { userId } = req.params;
    const authenticatedUser = req.session.user;
    // Authorization Check: Allow access if the user is an admin or is requesting their own photo.
    const isAdminRoles = authenticatedUser.role === 'admin' || authenticatedUser.role === 'superadmin';
    if (!isAdminRoles && parseInt(userId, 10) !== authenticatedUser.id) {
        return res.status(403).json({ message: 'Forbidden: You can only access your own photo.' });
    }

    try {
        const photoUrl = await userService.getUserPhotoUrl(userId);
        if (photoUrl) {
            // Redirect to the MinIO URL
            return res.redirect(photoUrl);
        }
        res.status(404).send('Photo not found.');
    } catch (error) {
        console.error('Error fetching user photo:', error);
        res.status(500).send('Error fetching photo.');
    }
};

const updateUserProfile = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const { name, password } = req.body;
        let photo_url = null;

        if (req.file) {
            // Delete old photo if it exists
            const currentProfile = await userService.getUserProfile(userId);
            if (currentProfile.photo_url) {
                await imageService.deleteImage(currentProfile.photo_url);
            }
            photo_url = await imageService.uploadImage(
                req.file.buffer,
                'users',
                req.file.originalname,
                req.file.mimetype
            );
        }

        const updatedUser = await userService.updateUserProfile(userId, { name, password, photo_url });
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

const updateUserBySuperAdmin = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { name, is_active } = req.body;
        let photo_url = null;

        if (req.file) {
            // Delete old photo if it exists
            const currentProfile = await userService.getUserProfile(userId);
            if (currentProfile.photo_url) {
                await imageService.deleteImage(currentProfile.photo_url);
            }
            photo_url = await imageService.uploadImage(
                req.file.buffer,
                'users',
                req.file.originalname,
                req.file.mimetype
            );
        }

        const updatedUser = await userService.updateUserBySuperAdmin(userId, { name, photo_url, is_active });
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

const changeUserPasswordBySuperAdmin = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ message: 'New password is required.' });
        }

        await userService.changeUserPasswordBySuperAdmin(userId, newPassword);

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        next(error);
    }
};

const getUserProfile = async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const user = await userService.getUserProfile(userId);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

const updateUserStatus = async (req, res, next) => {
    // This should be protected and only accessible by superadmin
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    try {
        const { userId } = req.params;
        const { isActive } = req.body;
        const updatedUser = await userService.updateUserStatus(userId, isActive);
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getAllUsers,
    getAllUsersForSuperAdmin,
    getActiveUsers,
    getUserPhoto,
    updateUserProfile,
    updateUserBySuperAdmin,
    changeUserPasswordBySuperAdmin,
    getUserProfile,
    updateUserStatus
};