/**
 * Upload file size limits (in bytes)
 * Central location for all file upload size configurations
 */

const UPLOAD_LIMITS = {
    // User profile photo limit
    USER_PHOTO: 500 * 1024,  // 500KB

    // CMC member photo limit
    CMC_PHOTO: 500 * 1024,   // 500KB

    // Menu item image limit
    MENU_IMAGE: 500 * 1024,  // 500KB

    // Default limit for backwards compatibility
    DEFAULT: 100 * 1024      // 100KB
};

/**
 * Form field names for uploads
 */
const UPLOAD_FIELDS = {
    PHOTO: 'photo',
    IMAGE: 'image'
};

module.exports = {
    UPLOAD_LIMITS,
    UPLOAD_FIELDS
};
