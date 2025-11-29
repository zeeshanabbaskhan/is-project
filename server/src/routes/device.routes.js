import express from 'express';
import { authenticate, logAccess } from '../middleware/index.js';
import { deviceController } from '../controllers/index.js';

const router = express.Router();

// GET /api/devices - Get user's active devices/sessions
router.get('/', authenticate, deviceController.getDevices);

// DELETE /api/devices/:id - Revoke a device session
router.delete('/:id', authenticate, logAccess('device_revoke', 'device'), deviceController.revokeDevice);

// POST /api/devices/revoke-all - Revoke all other sessions
router.post('/revoke-all', authenticate, deviceController.revokeAllOtherDevices);

// PUT /api/devices/:id/trust - Mark a device as trusted
router.put('/:id/trust', authenticate, logAccess('device_trust', 'device'), deviceController.trustDevice);

// PUT /api/devices/:id/rename - Rename a device
router.put('/:id/rename', authenticate, deviceController.renameDevice);

export default router;
