const Minio = require('minio');
const fs = require('fs');

/**
 * Read a secret from Docker Swarm secret files.
 */
const readSecret = (secretName) => {
    try {
        return fs.readFileSync(`/run/secrets/${secretName}`, 'utf8').trim();
    } catch (err) {
        return null;
    }
};

let minioClient = null;
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'cafe-images';

/**
 * Initialize the MinIO client.
 * - Production: reads credentials from Docker Swarm secrets
 * - Development: reads from .env variables
 */
const initMinioClient = () => {
    if (minioClient) return minioClient;

    const inProduction = fs.existsSync('/run/secrets/minio_root_user');

    let endPoint, port, accessKey, secretKey, useSSL;

    if (inProduction) {
        console.log('MinIO: Using Docker secrets for credentials.');
        endPoint = 'minio'; // Docker service name
        port = 9000;
        accessKey = readSecret('minio_root_user');
        secretKey = readSecret('minio_root_password');
        useSSL = false;

        if (!accessKey || !secretKey) {
            throw new Error('MinIO secrets (minio_root_user, minio_root_password) are missing.');
        }
    } else {
        console.log('MinIO: Using .env credentials for development.');
        endPoint = process.env.MINIO_ENDPOINT || 'localhost';
        port = parseInt(process.env.MINIO_PORT, 10) || 9000;
        accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
        secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
        useSSL = process.env.MINIO_USE_SSL === 'true';
    }

    minioClient = new Minio.Client({
        endPoint,
        port,
        useSSL,
        accessKey,
        secretKey,
    });

    console.log(`MinIO client initialized: ${endPoint}:${port}`);
    return minioClient;
};

/**
 * Ensure the bucket exists and has a public read policy for images.
 */
const ensureBucket = async () => {
    const client = initMinioClient();
    const exists = await client.bucketExists(BUCKET_NAME);

    if (!exists) {
        await client.makeBucket(BUCKET_NAME, '');
        console.log(`MinIO: Created bucket '${BUCKET_NAME}'.`);
    }

    // Set bucket policy to allow public read access
    const policy = {
        Version: '2012-10-17',
        Statement: [
            {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
            },
        ],
    };

    await client.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    console.log(`MinIO: Public read policy set on '${BUCKET_NAME}'.`);
};

/**
 * Get the MinIO client instance.
 */
const getMinioClient = () => {
    if (!minioClient) {
        initMinioClient();
    }
    return minioClient;
};

/**
 * Get the public base URL for serving images.
 * In production, this goes through the Docker network or a reverse proxy.
 */
const getMinioPublicUrl = () => {
    if (process.env.MINIO_PUBLIC_URL) {
        return process.env.MINIO_PUBLIC_URL;
    }
    const inProduction = fs.existsSync('/run/secrets/minio_root_user');
    if (inProduction) {
        // In production, MinIO is accessed via the Docker host or reverse proxy
        return `http://minio:9000`;
    }
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    return `${protocol}://${endpoint}:${port}`;
};

module.exports = {
    getMinioClient,
    ensureBucket,
    initMinioClient,
    getMinioPublicUrl,
    BUCKET_NAME,
};
