import express from 'express';
import * as cryptoController from '../controllers/crypto.controller.js';

const router = express.Router();

// GET /api/crypto/public-key - Get server's RSA public key for encryption
router.get('/public-key', cryptoController.getPublicKey);

// POST /api/crypto/client-key - Store client's RSA public key for encrypted responses
router.post('/client-key', cryptoController.registerClientKey);

// Legacy routes for backward compatibility
router.get('/server-public-key', cryptoController.getPublicKey);
router.post('/client-public-key', cryptoController.registerClientKey);

export default router;
