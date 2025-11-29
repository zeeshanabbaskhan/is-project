import jwt from 'jsonwebtoken';
import { User, DeviceSession, AccessLog } from '../models/index.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header or cookie
        let token = null;

        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please log in again.'
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            return res.status(403).json({
                success: false,
                message: 'Account is temporarily locked. Please try again later.'
            });
        }

        // Verify session if sessionId in token
        if (decoded.sessionId) {
            const session = await DeviceSession.findById(decoded.sessionId);

            if (!session || !session.isValid()) {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please log in again.'
                });
            }

            // Update session activity
            await session.updateActivity();
            req.session = session;
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please log in again.'
            });
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * Optional authentication - attaches user if token present but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
    try {
        let token = null;

        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');

            if (user && !user.isLocked()) {
                req.user = user;
                req.userId = user._id;
            }
        }

        next();
    } catch (error) {
        // Ignore errors - this is optional auth
        next();
    }
};

/**
 * Generate JWT token
 */
export const generateToken = (user, sessionId = null, expiresIn = '7d') => {
    const payload = {
        userId: user._id,
        email: user.email
    };

    if (sessionId) {
        payload.sessionId = sessionId;
    }

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Log access for security tracking
 */
export const logAccess = (action, resourceType = 'other') => {
    return async (req, res, next) => {
        // Store original end function
        const originalEnd = res.end;

        res.end = async function (...args) {
            // Log after response is sent
            try {
                await AccessLog.log({
                    user: req.userId || null,
                    action,
                    resourceType,
                    resourceId: req.params.id || null,
                    ip: req.ip || req.connection.remoteAddress,
                    userAgent: req.headers['user-agent'] || '',
                    deviceId: req.headers['x-device-id'] || null,
                    sessionId: req.session?._id || null,
                    success: res.statusCode < 400,
                    metadata: {
                        method: req.method,
                        path: req.originalUrl,
                        statusCode: res.statusCode
                    }
                });
            } catch (error) {
                console.error('Failed to log access:', error);
            }

            // Call original end
            originalEnd.apply(res, args);
        };

        next();
    };
};
