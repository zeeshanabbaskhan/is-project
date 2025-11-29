import { DeviceSession } from '../models/index.js';

/**
 * Get user's active devices/sessions
 */
export const getDevices = async (req, res) => {
    try {
        const sessions = await DeviceSession.getActiveSessionsForUser(req.userId);

        res.json({
            success: true,
            devices: sessions.map(session => {
                // Format location as a string
                let locationStr = 'Unknown Location';
                if (session.location) {
                    const parts = [];
                    if (session.location.city) parts.push(session.location.city);
                    if (session.location.region) parts.push(session.location.region);
                    if (session.location.country) parts.push(session.location.country);
                    if (parts.length > 0) {
                        locationStr = parts.join(', ');
                    }
                }

                return {
                    id: session._id,
                    deviceId: session.deviceId,
                    deviceName: session.deviceName,
                    deviceType: session.deviceType,
                    browser: session.browser,
                    browserVersion: session.browserVersion,
                    os: session.os,
                    osVersion: session.osVersion,
                    ip: session.ip,
                    location: locationStr,
                    isTrusted: session.isTrusted,
                    isCurrentDevice: session._id.toString() === req.session?._id?.toString(),
                    lastActivity: session.lastActivity,
                    createdAt: session.createdAt
                };
            })
        });
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get devices'
        });
    }
};

/**
 * Revoke a device session
 */
export const revokeDevice = async (req, res) => {
    try {
        const session = await DeviceSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Device session not found'
            });
        }

        // Verify ownership
        if (session.user.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await session.revoke('Revoked by user');

        res.json({
            success: true,
            message: 'Device session revoked successfully'
        });
    } catch (error) {
        console.error('Revoke device error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke device'
        });
    }
};

/**
 * Revoke all other sessions
 */
export const revokeAllOtherDevices = async (req, res) => {
    try {
        await DeviceSession.revokeAllForUser(req.userId, req.session?._id);

        res.json({
            success: true,
            message: 'All other sessions revoked successfully'
        });
    } catch (error) {
        console.error('Revoke all devices error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke sessions'
        });
    }
};

/**
 * Toggle device trust status
 */
export const trustDevice = async (req, res) => {
    try {
        const session = await DeviceSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Device session not found'
            });
        }

        if (session.user.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        session.isTrusted = !session.isTrusted;
        await session.save();

        res.json({
            success: true,
            message: `Device ${session.isTrusted ? 'trusted' : 'untrusted'}`,
            isTrusted: session.isTrusted
        });
    } catch (error) {
        console.error('Trust device error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update device trust status'
        });
    }
};

/**
 * Rename a device
 */
export const renameDevice = async (req, res) => {
    try {
        const { deviceName } = req.body;

        if (!deviceName) {
            return res.status(400).json({
                success: false,
                message: 'Device name is required'
            });
        }

        const session = await DeviceSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Device session not found'
            });
        }

        if (session.user.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        session.deviceName = deviceName;
        await session.save();

        res.json({
            success: true,
            message: 'Device renamed successfully',
            deviceName: session.deviceName
        });
    } catch (error) {
        console.error('Rename device error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to rename device'
        });
    }
};
