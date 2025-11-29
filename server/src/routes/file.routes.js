import express from 'express';
import { authenticate, logAccess, uploadEncrypted, handleUploadError } from '../middleware/index.js';
import * as fileController from '../controllers/file.controller.js';

const router = express.Router();

// GET /api/files/stats/summary - Get file statistics (must be before /:id)
router.get('/stats/summary', authenticate, fileController.getFileStats);

// GET /api/files/shared - Get files shared WITH the current user (inbox)
router.get('/shared', authenticate, fileController.getSharedWithMe);

// POST /api/files/upload - Upload encrypted file
router.post('/upload', authenticate, uploadEncrypted, handleUploadError, logAccess('file_upload', 'file'), fileController.uploadFile);

// GET /api/files - Get user's files
router.get('/', authenticate, fileController.getFiles);

// GET /api/files/:id - Get file details
router.get('/:id', authenticate, fileController.getFile);

// GET /api/files/:id/preview - Preview file (inline viewing)
router.get('/:id/preview', authenticate, logAccess('file_view', 'file'), fileController.previewFile);

// GET /api/files/:id/download - Download and decrypt file
router.get('/:id/download', authenticate, logAccess('file_download', 'file'), fileController.downloadFile);

// PUT /api/files/:id - Update file metadata
router.put('/:id', authenticate, fileController.updateFile);

// DELETE /api/files/:id/share - Remove a shared user from file
router.delete('/:id/share', authenticate, logAccess('file_unshare', 'file'), fileController.removeSharedUser);

// DELETE /api/files/:id - Delete file
router.delete('/:id', authenticate, logAccess('file_delete', 'file'), fileController.deleteFile);

export default router;
