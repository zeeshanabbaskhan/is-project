import {
    hybridDecrypt,
    hybridEncrypt,
    getClientPublicKey,
    storeClientPublicKey
} from '../utils/crypto.js';

/**
 * Middleware to decrypt incoming encrypted requests
 * Client sends: { encryptedKey, iv, encryptedData }
 * This decrypts and replaces req.body with decrypted data
 */
export const decryptRequest = async (req, res, next) => {
    try {
        // Skip if no body or not encrypted
        if (!req.body || !req.body.encryptedKey) {
            return next();
        }

        const { encryptedKey, iv, encryptedData } = req.body;

        // Validate encrypted package
        if (!encryptedKey || !iv || !encryptedData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid encrypted request format'
            });
        }

        // Decrypt the request body
        const decrypted = hybridDecrypt({ encryptedKey, iv, encryptedData });

        // Parse JSON and replace body
        req.body = JSON.parse(decrypted);
        req.isEncrypted = true;

        next();
    } catch (error) {
        console.error('Request decryption error:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to decrypt request'
        });
    }
};

/**
 * Middleware to encrypt outgoing responses
 * Uses client's public key from session/header
 */
export const encryptResponse = async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = (data) => {
        try {
            // Get client's public key
            const sessionId = req.headers['x-session-id'] || req.session?._id?.toString();
            let clientPublicKey = null;

            if (sessionId) {
                clientPublicKey = getClientPublicKey(sessionId);
            }

            // Also check if client sent public key in header
            if (!clientPublicKey && req.headers['x-client-public-key']) {
                clientPublicKey = Buffer.from(
                    req.headers['x-client-public-key'],
                    'base64'
                ).toString('utf8');
            }

            // If we have client's public key, encrypt response
            if (clientPublicKey && req.isEncrypted !== false) {
                const encrypted = hybridEncrypt(data, clientPublicKey);
                return originalJson({
                    encrypted: true,
                    ...encrypted
                });
            }

            // Otherwise, send unencrypted
            return originalJson(data);
        } catch (error) {
            console.error('Response encryption error:', error);
            // On encryption error, send unencrypted
            return originalJson(data);
        }
    };

    next();
};

/**
 * Combined encryption middleware (decrypt request + encrypt response)
 */
export const encryptionMiddleware = [decryptRequest, encryptResponse];

/**
 * Middleware to handle encrypted file uploads
 * File is sent encrypted by client, we store it as-is (already encrypted)
 */
export const handleEncryptedUpload = async (req, res, next) => {
    // For file uploads, the encryption metadata comes in headers or form fields
    // The file itself is already encrypted by the client

    if (req.headers['x-file-encryption-key']) {
        req.fileEncryption = {
            key: req.headers['x-file-encryption-key'],
            iv: req.headers['x-file-encryption-iv'],
            originalHash: req.headers['x-file-original-hash']
        };
    }

    next();
};

/**
 * Store client's public key for encrypted communication
 */
export const registerClientKey = (sessionId, publicKey) => {
    storeClientPublicKey(sessionId, publicKey);
};
