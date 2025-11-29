import express from 'express';
import { authenticate } from '../middleware/index.js';
import { analyticsController } from '../controllers/index.js';

const router = express.Router();

// GET /api/analytics/activity - Get user's recent activity
router.get('/activity', authenticate, analyticsController.getActivity);

// GET /api/analytics/summary - Get activity summary
router.get('/summary', authenticate, analyticsController.getSummary);

// GET /api/analytics/files/:id - Get file-specific activity
router.get('/files/:id', authenticate, analyticsController.getFileActivity);

// GET /api/analytics/dashboard - Get dashboard statistics
router.get('/dashboard', authenticate, analyticsController.getDashboardStats);

// GET /api/analytics/security - Get security-related analytics
router.get('/security', authenticate, analyticsController.getSecurityAnalytics);

export default router;
