import { User, DeviceSession, AccessLog } from '../models/index.js';
import { generateToken } from '../middleware/auth.middleware.js';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Register a new user
 */
export const register = async (req, res) => {
    try {
        const { name, fullName, email, password } = req.body;
        const userName = name || fullName; // Accept both 'name' and 'fullName'

        // Validation
        if (!userName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create user
        const user = await User.create({
            name: userName,
            email: email.toLowerCase(),
            password
        });

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                fullName: user.name, // Include both for frontend compatibility
                email: user.email,
                avatar: user.avatar,
                plan: user.plan,
                storageUsed: user.storageUsed,
                storageLimit: user.storageLimit
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

/**
 * Login user
 */
export const login = async (req, res) => {
    try {
        const { email, password, deviceId, deviceName, twoFactorCode } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() }).select('+twoFactorSecret');
        if (!user) {
            await AccessLog.log({
                action: 'failed_login',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                success: false,
                errorMessage: 'User not found'
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            return res.status(403).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            await user.incrementLoginAttempts();

            await AccessLog.log({
                user: user._id,
                action: 'failed_login',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                success: false,
                errorMessage: 'Invalid password'
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled && user.twoFactorSecret) {
            // If no 2FA code provided, ask for it
            if (!twoFactorCode) {
                return res.json({
                    success: true,
                    requiresTwoFactor: true,
                    message: 'Two-factor authentication code required'
                });
            }

            // Verify 2FA code
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 1 // Allow 1 step before/after for time drift
            });

            if (!verified) {
                await AccessLog.log({
                    user: user._id,
                    action: 'failed_login',
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    success: false,
                    errorMessage: 'Invalid 2FA code'
                });

                return res.status(401).json({
                    success: false,
                    message: 'Invalid two-factor authentication code'
                });
            }
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Create device session
        const deviceInfo = DeviceSession.parseUserAgent(req.headers['user-agent'] || '');
        const session = await DeviceSession.create({
            user: user._id,
            deviceId: deviceId || crypto.randomBytes(16).toString('hex'),
            deviceName: deviceName || `${deviceInfo.browser} on ${deviceInfo.os}`,
            deviceType: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            browserVersion: deviceInfo.browserVersion,
            os: deviceInfo.os,
            osVersion: deviceInfo.osVersion,
            ip: req.ip,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        // Update user's last login
        user.lastLogin = new Date();
        user.lastLoginIp = req.ip;
        await user.save();

        // Generate token with session
        const token = generateToken(user, session._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            sessionId: session._id,
            user: {
                id: user._id,
                name: user.name,
                fullName: user.name, // Include both for frontend compatibility
                email: user.email,
                avatar: user.avatar,
                plan: user.plan,
                storageUsed: user.storageUsed,
                storageLimit: user.storageLimit,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
    try {
        if (req.session) {
            await req.session.revoke('User logged out');
        }

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

/**
 * Get current user info
 */
export const getMe = async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user info'
        });
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const user = await User.findById(req.userId);

        if (name) user.name = name;
        if (avatar !== undefined) user.avatar = avatar;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

/**
 * Change user password
 */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const user = await User.findById(req.userId).select('+password');

        // Verify current password
        const isValid = await user.comparePassword(currentPassword);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Revoke all other sessions
        await DeviceSession.revokeAllForUser(user._id, req.session?._id);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

/**
 * Search users by name or email
 */
export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        // Search users by name or email (case-insensitive)
        // Exclude current user from results
        const users = await User.find({
            _id: { $ne: req.userId },
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        })
            .select('_id name email avatar')
            .limit(10)
            .lean();

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search users'
        });
    }
};

/**
 * Get user settings
 */
export const getSettings = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('settings twoFactorEnabled');

        res.json({
            success: true,
            settings: {
                privacyMode: user.settings?.privacyMode || false,
                autoLogoutMinutes: user.settings?.autoLogoutMinutes || 30,
                emailNotifications: user.settings?.emailNotifications !== false,
                shareNotifications: user.settings?.shareNotifications !== false,
                twoFactorEnabled: user.twoFactorEnabled || false
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings'
        });
    }
};

/**
 * Update user settings
 */
export const updateSettings = async (req, res) => {
    try {
        const { privacyMode, autoLogoutMinutes, emailNotifications, shareNotifications } = req.body;

        const user = await User.findById(req.userId);

        // Initialize settings object if it doesn't exist
        if (!user.settings) {
            user.settings = {};
        }

        // Update only provided settings
        if (typeof privacyMode === 'boolean') {
            user.settings.privacyMode = privacyMode;
        }
        if (typeof autoLogoutMinutes === 'number') {
            user.settings.autoLogoutMinutes = Math.min(Math.max(autoLogoutMinutes, 5), 120);
        }
        if (typeof emailNotifications === 'boolean') {
            user.settings.emailNotifications = emailNotifications;
        }
        if (typeof shareNotifications === 'boolean') {
            user.settings.shareNotifications = shareNotifications;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings: user.settings
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings'
        });
    }
};

/**
 * Delete user account
 */
export const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account'
            });
        }

        const user = await User.findById(req.userId).select('+password');

        // Verify password
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect'
            });
        }

        // Revoke all sessions
        await DeviceSession.revokeAllForUser(user._id);

        // Delete user (you may want to also delete their files, notes, etc.)
        await User.findByIdAndDelete(req.userId);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
};

/**
 * Setup 2FA - Generate secret and QR code
 */
export const setup2FA = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Two-factor authentication is already enabled'
            });
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `SecureVault (${user.email})`,
            issuer: 'SecureVault'
        });

        // Store the secret temporarily (will be confirmed when user verifies)
        user.twoFactorSecret = secret.base32;
        await user.save();

        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            success: true,
            qrCode,
            manualEntryKey: secret.base32
        });
    } catch (error) {
        console.error('Setup 2FA error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to setup two-factor authentication'
        });
    }
};

/**
 * Enable 2FA - Verify code and enable
 */
export const enable2FA = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Verification code is required'
            });
        }

        const user = await User.findById(req.userId).select('+twoFactorSecret');

        if (!user.twoFactorSecret) {
            return res.status(400).json({
                success: false,
                message: 'Please setup 2FA first'
            });
        }

        if (user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Two-factor authentication is already enabled'
            });
        }

        // Verify code
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!verified) {
            return res.status(401).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Enable 2FA
        user.twoFactorEnabled = true;
        await user.save();

        await AccessLog.log({
            user: user._id,
            action: '2fa_enable',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            success: true
        });

        res.json({
            success: true,
            message: 'Two-factor authentication enabled successfully'
        });
    } catch (error) {
        console.error('Enable 2FA error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to enable two-factor authentication'
        });
    }
};

/**
 * Disable 2FA
 */
export const disable2FA = async (req, res) => {
    try {
        const { password, code } = req.body;

        if (!password || !code) {
            return res.status(400).json({
                success: false,
                message: 'Password and verification code are required'
            });
        }

        const user = await User.findById(req.userId).select('+password +twoFactorSecret');

        if (!user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Two-factor authentication is not enabled'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Verify 2FA code
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!verified) {
            return res.status(401).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Disable 2FA
        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        await user.save();

        await AccessLog.log({
            user: user._id,
            action: '2fa_disable',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            success: true
        });

        res.json({
            success: true,
            message: 'Two-factor authentication disabled successfully'
        });
    } catch (error) {
        console.error('Disable 2FA error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disable two-factor authentication'
        });
    }
};
