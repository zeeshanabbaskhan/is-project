import express from 'express';
import { authenticate, optionalAuth, logAccess } from '../middleware/index.js';
import { shareController } from '../controllers/index.js';

const router = express.Router();

// POST /api/share/create - Create a share link for a file
router.post('/create', authenticate, logAccess('share_link_create', 'share_link'), shareController.createShareLink);

// GET /api/share - Get user's share links
router.get('/', authenticate, shareController.getShareLinks);

// DELETE /api/share/:id - Delete a share link
router.delete('/:id', authenticate, logAccess('share_link_delete', 'share_link'), shareController.revokeShareLink);

// PUT /api/share/:id/toggle - Toggle share link active status
router.put('/:id/toggle', authenticate, shareController.toggleShareLink);

// GET /api/share/:id/trace - Get share link access trace/logs (must be before /:token)
router.get('/:id/trace', authenticate, shareController.getShareLinkTrace);

// GET /api/share/:token/preview - Preview file via share link
router.get('/:token/preview', optionalAuth, shareController.previewSharedFile);

// GET /api/share/:token/download - Download file via share link
router.get('/:token/download', optionalAuth, shareController.downloadSharedFile);

// GET /api/share/:token - Access a shared file via token (must be last due to wildcard)
router.get('/:token', optionalAuth, logAccess('share_link_access', 'share_link'), shareController.accessShareLink);

export default router;
