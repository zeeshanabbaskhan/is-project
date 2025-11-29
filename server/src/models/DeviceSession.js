import mongoose from 'mongoose';
import crypto from 'crypto';

const deviceSessionSchema = new mongoose.Schema({
    // Reference to user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Session token for this device
    sessionToken: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomBytes(64).toString('hex')
    },
    // Device identification
    deviceId: {
        type: String,
        required: true // Generated on client, stored for identification
    },
    deviceName: {
        type: String,
        default: 'Unknown Device'
    },
    deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'unknown'],
        default: 'unknown'
    },
    // Browser/OS info
    browser: {
        type: String,
        default: 'Unknown'
    },
    browserVersion: {
        type: String,
        default: ''
    },
    os: {
        type: String,
        default: 'Unknown'
    },
    osVersion: {
        type: String,
        default: ''
    },
    // Location (from IP)
    ip: {
        type: String,
        required: true
    },
    location: {
        city: String,
        region: String,
        country: String,
        timezone: String
    },
    // Client's RSA public key for this session
    publicKey: {
        type: String,
        default: null
    },
    // Session status
    isActive: {
        type: Boolean,
        default: true
    },
    isTrusted: {
        type: Boolean,
        default: false
    },
    // Timestamps
    lastActivity: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    // Revocation
    revokedAt: {
        type: Date,
        default: null
    },
    revokedReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
deviceSessionSchema.index({ user: 1, isActive: 1 });
deviceSessionSchema.index({ sessionToken: 1 });
deviceSessionSchema.index({ deviceId: 1 });
deviceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Method to check if session is valid
deviceSessionSchema.methods.isValid = function () {
    if (!this.isActive) return false;
    if (this.revokedAt) return false;
    if (this.expiresAt < new Date()) return false;
    return true;
};

// Method to update last activity
deviceSessionSchema.methods.updateActivity = async function () {
    this.lastActivity = new Date();
    await this.save();
};

// Method to revoke session
deviceSessionSchema.methods.revoke = async function (reason = 'User logged out') {
    this.isActive = false;
    this.revokedAt = new Date();
    this.revokedReason = reason;
    await this.save();
};

// Static: Revoke all sessions for a user
deviceSessionSchema.statics.revokeAllForUser = async function (userId, exceptSessionId = null) {
    const query = { user: userId, isActive: true };
    if (exceptSessionId) {
        query.sessionToken = { $ne: exceptSessionId };
    }

    await this.updateMany(query, {
        $set: {
            isActive: false,
            revokedAt: new Date(),
            revokedReason: 'All sessions revoked'
        }
    });
};

// Static: Get active sessions for user
deviceSessionSchema.statics.getActiveSessionsForUser = async function (userId) {
    return this.find({
        user: userId,
        isActive: true,
        expiresAt: { $gt: new Date() }
    }).sort({ lastActivity: -1 });
};

// Static: Parse user agent to extract device info
deviceSessionSchema.statics.parseUserAgent = function (userAgent) {
    const info = {
        deviceType: 'unknown',
        browser: 'Unknown',
        browserVersion: '',
        os: 'Unknown',
        osVersion: ''
    };

    if (!userAgent) return info;

    // Detect device type
    if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
        info.deviceType = /iPad|Tablet/i.test(userAgent) ? 'tablet' : 'mobile';
    } else {
        info.deviceType = 'desktop';
    }

    // Detect browser
    const browsers = [
        { name: 'Edge', regex: /Edg\/(\d+)/ },
        { name: 'Chrome', regex: /Chrome\/(\d+)/ },
        { name: 'Firefox', regex: /Firefox\/(\d+)/ },
        { name: 'Safari', regex: /Version\/(\d+).*Safari/ },
        { name: 'Opera', regex: /OPR\/(\d+)/ }
    ];

    for (const browser of browsers) {
        const match = userAgent.match(browser.regex);
        if (match) {
            info.browser = browser.name;
            info.browserVersion = match[1];
            break;
        }
    }

    // Detect OS
    if (/Windows NT 10/i.test(userAgent)) {
        info.os = 'Windows';
        info.osVersion = '10';
    } else if (/Windows NT 6.3/i.test(userAgent)) {
        info.os = 'Windows';
        info.osVersion = '8.1';
    } else if (/Mac OS X/i.test(userAgent)) {
        info.os = 'macOS';
        const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
        if (match) info.osVersion = match[1].replace('_', '.');
    } else if (/Linux/i.test(userAgent)) {
        info.os = 'Linux';
    } else if (/Android/i.test(userAgent)) {
        info.os = 'Android';
        const match = userAgent.match(/Android (\d+)/);
        if (match) info.osVersion = match[1];
    } else if (/iPhone|iPad/i.test(userAgent)) {
        info.os = 'iOS';
        const match = userAgent.match(/OS (\d+)/);
        if (match) info.osVersion = match[1];
    }

    return info;
};

const DeviceSession = mongoose.model('DeviceSession', deviceSessionSchema);

export default DeviceSession;
