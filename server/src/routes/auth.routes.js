import express from 'express';
import { authenticate, logAccess } from '../middleware/index.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', logAccess('register', 'user'), authController.register);

// POST /api/auth/login - Login user
router.post('/login', logAccess('login', 'user'), authController.login);

// POST /api/auth/logout - Logout user (revoke session)
router.post('/logout', authenticate, logAccess('logout', 'user'), authController.logout);

// GET /api/auth/me - Get current user info
router.get('/me', authenticate, authController.getMe);

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticate, authController.updateProfile);

// POST /api/auth/change-password - Change user password
router.post('/change-password', authenticate, logAccess('password_change', 'user'), authController.changePassword);

// GET /api/auth/settings - Get user settings
router.get('/settings', authenticate, authController.getSettings);

// PUT /api/auth/settings - Update user settings
router.put('/settings', authenticate, authController.updateSettings);

// DELETE /api/auth/account - Delete user account
router.delete('/account', authenticate, logAccess('account_delete', 'user'), authController.deleteAccount);

// 2FA Routes
// POST /api/auth/2fa/setup - Setup 2FA (get QR code and secret)
router.post('/2fa/setup', authenticate, authController.setup2FA);

// POST /api/auth/2fa/enable - Enable 2FA after verifying code
router.post('/2fa/enable', authenticate, logAccess('2fa_enable', 'user'), authController.enable2FA);

// POST /api/auth/2fa/disable - Disable 2FA
router.post('/2fa/disable', authenticate, logAccess('2fa_disable', 'user'), authController.disable2FA);

// GET /api/auth/users/search - Search users by name or email
router.get('/users/search', authenticate, authController.searchUsers);

export default router;
