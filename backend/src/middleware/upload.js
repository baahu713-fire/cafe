const multer = require('multer');
const path = require('path');
const { UPLOAD_LIMITS, UPLOAD_FIELDS } = require('../constants/uploadLimits');

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
 * @param {number} options.maxSize - Maximum file size in bytes (default: UPLOAD_LIMITS.DEFAULT)
 * @param {string} options.fieldName - Form field name (default: 'photo')
 * @returns {Function} Multer middleware
 */
const createUpload = (options = {}) => {
    const maxSize = options.maxSize || UPLOAD_LIMITS.DEFAULT;
    const fieldName = options.fieldName || UPLOAD_FIELDS.PHOTO;

    const upload = multer({
        storage: storage,
        limits: { fileSize: maxSize },
        fileFilter: (req, file, cb) => {
            checkFileType(file, cb);
        }
    });

    const multerMiddleware = upload.single(fieldName);

    // Wrapper middleware to attach maxSize to req for error handler
    return (req, res, next) => {
        req.uploadMaxSize = maxSize; // Attach limit for error handler
        multerMiddleware(req, res, next);
    };
};

// Default upload middleware for backwards compatibility
const defaultUpload = createUpload({ maxSize: UPLOAD_LIMITS.DEFAULT, fieldName: UPLOAD_FIELDS.PHOTO });

// Pre-configured uploads for common use cases
const uploads = {
    // User profile photo
    userPhoto: createUpload({ maxSize: UPLOAD_LIMITS.USER_PHOTO, fieldName: UPLOAD_FIELDS.PHOTO }),
    // CMC member photo
    cmcPhoto: createUpload({ maxSize: UPLOAD_LIMITS.CMC_PHOTO, fieldName: UPLOAD_FIELDS.PHOTO }),
    // Menu item image
    menuImage: createUpload({ maxSize: UPLOAD_LIMITS.MENU_IMAGE, fieldName: UPLOAD_FIELDS.IMAGE })
};

module.exports = defaultUpload;
module.exports.createUpload = createUpload;
module.exports.uploads = uploads;


