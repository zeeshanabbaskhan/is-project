import { getServerPublicKey, storeClientPublicKey } from '../utils/crypto.js';

/**
 * Get server's RSA public key
 */
export const getPublicKey = (req, res) => {
    try {
        const publicKey = getServerPublicKey();

        res.json({
            success: true,
            publicKey
        });
    } catch (error) {
        console.error('Error getting server public key:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve server public key'
        });
    }
};

/**
 * Store client's RSA public key for encrypted responses
 */
export const registerClientKey = (req, res) => {
    try {
        const { publicKey, sessionId } = req.body;

        if (!publicKey) {
            return res.status(400).json({
                success: false,
                message: 'Public key is required'
            });
        }

        // Store client's public key
        const session = sessionId || req.headers['x-session-id'] || 'default';
        storeClientPublicKey(session, publicKey);

        res.json({
            success: true,
            message: 'Client public key registered successfully'
        });
    } catch (error) {
        console.error('Error storing client public key:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register client public key'
        });
    }
};
