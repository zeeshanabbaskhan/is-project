import mongoose from 'mongoose';
import crypto from 'crypto';

const shareLinkSchema = new mongoose.Schema({
    // Unique token for the share link
    token: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomBytes(32).toString('hex')
    },
    // Short code for easy sharing
    shortCode: {
        type: String,
        unique: true,
        sparse: true
    },
    // Reference to the file
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    },
    // Who created the share link
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Share settings
    permissions: {
        type: String,
        enum: ['view', 'download'],
        default: 'view'
    },
    // Access mode: public (anyone with link) or restricted (only allowed users)
    accessMode: {
        type: String,
        enum: ['public', 'restricted'],
        default: 'public'
    },
    // Allowed users for restricted mode
    allowedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Optional password protection
    password: {
        type: String,
        default: null // Hashed password if set
    },
    isPasswordProtected: {
        type: Boolean,
        default: false
    },
    // Download limit
    maxDownloads: {
        type: Number,
        default: null // null means unlimited
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    // Per-user download counts (for restricted mode)
    userDownloadCounts: [{
        odId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        count: {
            type: Number,
            default: 0
        }
    }],
    // One-time access
    oneTimeAccess: {
        type: Boolean,
        default: false
    },
    // Track users who have accessed (for restricted one-time access)
    usersWhoAccessed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Track if public one-time link has been accessed
    hasBeenAccessed: {
        type: Boolean,
        default: false
    },
    // Active access sessions (for one-time links to allow preview/download after first access)
    accessSessions: [{
        sessionToken: String,
        odId: mongoose.Schema.Types.ObjectId, // user ID for restricted, null for public
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 3600 // Session expires after 1 hour
        }
    }],
    // Expiration
    expiresAt: {
        type: Date,
        default: null // null means never expires
    },
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    // Access log with detailed tracking
    accessLog: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        ip: String,
        userAgent: String,
        action: {
            type: String,
            enum: ['view', 'download']
        },
        // Parsed user agent details
        browser: String,
        browserVersion: String,
        os: String,
        osVersion: String,
        device: String,
        deviceType: String, // desktop, mobile, tablet
        // Location (can be derived from IP)
        country: String,
        city: String,
        region: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    // Recipient info (optional)
    recipientEmail: {
        type: String,
        default: null
    },
    message: {
        type: String,
        maxlength: 500,
        default: null
    },
    // Notification settings
    notifyOnAccess: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
shareLinkSchema.index({ token: 1 });
shareLinkSchema.index({ shortCode: 1 });
shareLinkSchema.index({ file: 1 });
shareLinkSchema.index({ createdBy: 1 });
shareLinkSchema.index({ expiresAt: 1 });

// Generate short code before saving
shareLinkSchema.pre('save', function (next) {
    if (!this.shortCode) {
        this.shortCode = crypto.randomBytes(4).toString('hex');
    }
    next();
});

// Virtual for full URL (to be constructed in controller with base URL)
shareLinkSchema.virtual('shareUrl').get(function () {
    return `/share/${this.token}`;
});

// Method to check if link is valid (basic checks only)
shareLinkSchema.methods.isValid = function () {
    // Check if active
    if (!this.isActive) return false;

    // Check expiration
    if (this.expiresAt && this.expiresAt < new Date()) return false;

    // Check global download limit (for public links)
    if (this.accessMode === 'public' && this.maxDownloads && this.downloadCount >= this.maxDownloads) return false;

    return true;
};

// Method to get user's download count
shareLinkSchema.methods.getUserDownloadCount = function (userId) {
    if (!userId) return 0;
    const userRecord = this.userDownloadCounts.find(
        u => u.odId && u.odId.toString() === userId.toString()
    );
    return userRecord ? userRecord.count : 0;
};

// Method to check if user has reached download limit
shareLinkSchema.methods.hasUserReachedLimit = function (userId) {
    if (!this.maxDownloads) return false; // No limit set
    if (!userId) return false;
    return this.getUserDownloadCount(userId) >= this.maxDownloads;
};

// Method to increment user's download count
shareLinkSchema.methods.incrementUserDownload = async function (userId) {
    if (!userId) return;

    const userIndex = this.userDownloadCounts.findIndex(
        u => u.odId && u.odId.toString() === userId.toString()
    );

    if (userIndex >= 0) {
        this.userDownloadCounts[userIndex].count += 1;
    } else {
        this.userDownloadCounts.push({ odId: userId, count: 1 });
    }

    await this.save();
};

// Method to check if one-time public access has been used
shareLinkSchema.methods.isOneTimePublicUsed = function () {
    return this.oneTimeAccess && this.accessMode === 'public' && this.hasBeenAccessed;
};

// Method to check if user has already accessed (for restricted one-time links)
shareLinkSchema.methods.hasUserAccessed = function (userId) {
    if (!userId) return false;
    return this.usersWhoAccessed.some(
        id => id.toString() === userId.toString()
    );
};

// Method to mark user as accessed
shareLinkSchema.methods.markUserAccessed = async function (userId) {
    if (userId && !this.hasUserAccessed(userId)) {
        this.usersWhoAccessed.push(userId);
        await this.save();
    }
};

// Method to mark public link as accessed
shareLinkSchema.methods.markPublicAccessed = async function () {
    if (!this.hasBeenAccessed) {
        this.hasBeenAccessed = true;
        await this.save();
    }
};

// Method to create an access session (returns session token)
shareLinkSchema.methods.createAccessSession = async function (userId = null) {
    const crypto = await import('crypto');
    const sessionToken = crypto.randomBytes(32).toString('hex');
    this.accessSessions.push({
        sessionToken,
        odId: userId,
        createdAt: new Date()
    });
    await this.save();
    return sessionToken;
};

// Method to verify access session
shareLinkSchema.methods.verifyAccessSession = function (sessionToken, userId = null) {
    if (!sessionToken) return false;

    const session = this.accessSessions.find(s => s.sessionToken === sessionToken);
    if (!session) return false;

    // Check if session is expired (1 hour)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (session.createdAt < hourAgo) return false;

    // For restricted links, verify user matches
    if (this.accessMode === 'restricted' && userId) {
        return session.odId && session.odId.toString() === userId.toString();
    }

    return true;
};

// Method to verify password
shareLinkSchema.methods.verifyPassword = async function (password) {
    if (!this.isPasswordProtected || !this.password) return true;

    const bcryptModule = await import('bcryptjs');
    const bcrypt = bcryptModule.default || bcryptModule;
    return bcrypt.compare(password, this.password);
};

// Method to log access with full details
shareLinkSchema.methods.logAccess = async function (ip, userAgent, action, userId = null) {
    // Parse user agent for device, browser, OS info
    const { UAParser } = await import('ua-parser-js');
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type
    let deviceType = 'desktop';
    if (result.device.type === 'mobile') deviceType = 'mobile';
    else if (result.device.type === 'tablet') deviceType = 'tablet';

    const logEntry = {
        userId: userId || null,
        ip: ip || 'unknown',
        userAgent: userAgent || 'unknown',
        browser: result.browser.name || 'Unknown',
        browserVersion: result.browser.version || '',
        os: result.os.name || 'Unknown',
        osVersion: result.os.version || '',
        device: result.device.model || result.device.vendor || 'Unknown',
        deviceType: deviceType,
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        action: action,
        timestamp: new Date()
    };

    this.accessLog.push(logEntry);

    if (action === 'download') {
        this.downloadCount += 1;
    }

    await this.save();
    return logEntry;
};

// Static method to create with password
shareLinkSchema.statics.createWithPassword = async function (data, plainPassword) {
    if (plainPassword) {
        const bcryptModule = await import('bcryptjs');
        const bcrypt = bcryptModule.default || bcryptModule;
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(plainPassword, salt);
        data.isPasswordProtected = true;
    }

    return this.create(data);
};

const ShareLink = mongoose.model('ShareLink', shareLinkSchema);

export default ShareLink;
