const multer = require('multer');
const path = require('path');

// Use memoryStorage to hold the file as a buffer
const storage = multer.memoryStorage();

// Check file type - only allow images
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
    }
}

/**
 * Create a configurable multer upload middleware
 * @param {Object} options - Configuration options
 * @param {number} options.maxSize - Maximum file size in bytes (default: 100KB)
 * @param {string} options.fieldName - Form field name (default: 'photo')
 * @returns {Function} Multer middleware
 */
const createUpload = (options = {}) => {
    const maxSize = options.maxSize || 100 * 1024; // Default 100KB
    const fieldName = options.fieldName || 'photo';

    const upload = multer({
        storage: storage,
        limits: { fileSize: maxSize },
        fileFilter: (req, file, cb) => {
            checkFileType(file, cb);
        }
    });

    return upload.single(fieldName);
};

// Default upload middleware for backwards compatibility (100KB, 'photo' field)
const defaultUpload = createUpload({ maxSize: 100 * 1024, fieldName: 'photo' });

// Pre-configured uploads for common use cases
const uploads = {
    // User profile photo (100KB)
    userPhoto: createUpload({ maxSize: 100 * 1024, fieldName: 'photo' }),
    // CMC member photo (500KB)
    cmcPhoto: createUpload({ maxSize: 500 * 1024, fieldName: 'photo' }),
    // Menu item image (1MB)
    menuImage: createUpload({ maxSize: 1024 * 1024, fieldName: 'image' })
};

module.exports = defaultUpload;
module.exports.createUpload = createUpload;
module.exports.uploads = uploads;

