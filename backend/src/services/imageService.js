const crypto = require('crypto');
const path = require('path');
const { getMinioClient, getMinioPublicUrl, BUCKET_NAME } = require('../config/minioClient');

/**
 * Generate a unique filename to prevent collisions.
 * Format: <prefix>/<timestamp>-<random>.<ext>
 */
const generateObjectName = (prefix, originalFilename) => {
    const ext = path.extname(originalFilename || '.jpg').toLowerCase();
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}/${timestamp}-${random}${ext}`;
};

/**
 * Upload an image buffer to MinIO.
 * @param {Buffer} buffer - The image data
 * @param {string} prefix - Folder prefix (e.g., 'menu-items', 'users', 'cmc-members')
 * @param {string} originalFilename - Original filename for extension detection
 * @param {string} contentType - MIME type (e.g., 'image/jpeg')
 * @returns {string} The public URL of the uploaded image
 */
const uploadImage = async (buffer, prefix, originalFilename, contentType = 'image/jpeg') => {
    const client = getMinioClient();
    const objectName = generateObjectName(prefix, originalFilename);

    await client.putObject(BUCKET_NAME, objectName, buffer, buffer.length, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year (images are immutable)
    });

    return getImageUrl(objectName);
};

/**
 * Delete an image from MinIO by its URL or object name.
 * @param {string} imageUrl - The full URL or object name
 */
const deleteImage = async (imageUrl) => {
    if (!imageUrl) return;

    const client = getMinioClient();
    // Extract object name from URL: http://host:port/bucket/prefix/filename.jpg → prefix/filename.jpg
    const objectName = extractObjectName(imageUrl);

    if (objectName) {
        try {
            await client.removeObject(BUCKET_NAME, objectName);
        } catch (err) {
            console.error(`Failed to delete image from MinIO: ${objectName}`, err.message);
        }
    }
};

/**
 * Get the public URL for an object in MinIO.
 * - Production: /storage/menu-items/xxx.jpg (Nginx proxies /storage/ → minio:9000/cafe-images/)
 * - Development: http://localhost:9000/cafe-images/menu-items/xxx.jpg
 */
const getImageUrl = (objectName) => {
    const baseUrl = getMinioPublicUrl();
    // If baseUrl is a relative path (e.g., /storage), Nginx already maps to the bucket
    if (baseUrl.startsWith('/')) {
        return `${baseUrl}/${objectName}`;
    }
    // Absolute URL (development) — include the bucket name
    return `${baseUrl}/${BUCKET_NAME}/${objectName}`;
};

/**
 * Extract the object name from a full MinIO URL.
 * Handles:
 *   /storage/menu-items/1234.jpg → menu-items/1234.jpg
 *   http://host:9000/cafe-images/menu-items/1234.jpg → menu-items/1234.jpg
 */
const extractObjectName = (url) => {
    if (!url) return null;

    // Relative path from Nginx proxy: /storage/menu-items/1234.jpg
    if (url.startsWith('/storage/')) {
        return url.replace('/storage/', '');
    }

    // If it's already just an object name (no http, no /storage), return as is
    if (!url.startsWith('http')) return url;

    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2 && pathParts[0] === BUCKET_NAME) {
            return pathParts.slice(1).join('/');
        }
        return pathParts.join('/');
    } catch {
        return null;
    }
};

module.exports = {
    uploadImage,
    deleteImage,
    getImageUrl,
    extractObjectName,
};
