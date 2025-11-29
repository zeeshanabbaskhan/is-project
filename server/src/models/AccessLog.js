import mongoose from 'mongoose';

const accessLogSchema = new mongoose.Schema({
    // User who performed the action
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Can be null for anonymous access (shared links)
    },
    // Action details
    action: {
        type: String,
        required: true,
        enum: [
            // Auth actions
            'login', 'logout', 'register', 'password_change', 'password_reset',
            '2fa_enable', '2fa_disable', '2fa_verify',
            // File actions
            'file_upload', 'file_download', 'file_view', 'file_delete',
            'file_share', 'file_unshare', 'file_rename', 'file_move',
            // Share actions
            'share_link_create', 'share_link_access', 'share_link_delete',
            // Note actions
            'note_create', 'note_view', 'note_update', 'note_delete', 'note_share',
            // Device actions
            'device_register', 'device_revoke', 'device_trust',
            // Security events
            'failed_login', 'suspicious_activity', 'rate_limited',
            // Other
            'other'
        ]
    },
    // Resource that was acted upon
    resourceType: {
        type: String,
        enum: ['file', 'note', 'share_link', 'device', 'user', 'other'],
        default: 'other'
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    resourceName: {
        type: String,
        default: null
    },
    // Request metadata
    ip: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        default: ''
    },
    // Location (from IP)
    location: {
        city: String,
        region: String,
        country: String
    },
    // Device info
    deviceId: {
        type: String,
        default: null
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeviceSession',
        default: null
    },
    // Result
    success: {
        type: Boolean,
        default: true
    },
    errorMessage: {
        type: String,
        default: null
    },
    // Additional context
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Risk assessment
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    flags: [{
        type: String
    }]
}, {
    timestamps: true
});

// Indexes for efficient querying
accessLogSchema.index({ user: 1, createdAt: -1 });
accessLogSchema.index({ action: 1, createdAt: -1 });
accessLogSchema.index({ resourceType: 1, resourceId: 1 });
accessLogSchema.index({ ip: 1, createdAt: -1 });
accessLogSchema.index({ createdAt: -1 });
accessLogSchema.index({ riskLevel: 1 });

// TTL index - delete logs after 90 days
accessLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to log an action
accessLogSchema.statics.log = async function (data) {
    try {
        return await this.create(data);
    } catch (error) {
        console.error('Failed to create access log:', error);
        // Don't throw - logging should not break the main flow
    }
};

// Static method to get recent activity for a user
accessLogSchema.statics.getRecentActivity = async function (userId, limit = 50) {
    return this.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

// Static method to get activity summary
accessLogSchema.statics.getActivitySummary = async function (userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 },
                lastOccurrence: { $max: '$createdAt' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

// Static method to detect suspicious patterns
accessLogSchema.statics.checkSuspiciousActivity = async function (userId, ip) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check failed login attempts
    const failedLogins = await this.countDocuments({
        action: 'failed_login',
        ip,
        createdAt: { $gte: oneHourAgo }
    });

    // Check for multiple IPs
    const recentIPs = await this.distinct('ip', {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: oneHourAgo }
    });

    return {
        failedLoginCount: failedLogins,
        multipleIPs: recentIPs.length > 3,
        suspiciousPatternDetected: failedLogins > 5 || recentIPs.length > 5
    };
};

// Static method to get file activity
accessLogSchema.statics.getFileActivity = async function (fileId, limit = 20) {
    return this.find({
        resourceType: 'file',
        resourceId: new mongoose.Types.ObjectId(fileId)
    })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

// Static method to calculate risk level
accessLogSchema.statics.calculateRisk = function (action, context = {}) {
    const highRiskActions = ['password_change', 'password_reset', '2fa_disable', 'device_revoke'];
    const mediumRiskActions = ['file_delete', 'note_delete', 'failed_login', 'share_link_create'];

    if (highRiskActions.includes(action)) return 'high';
    if (mediumRiskActions.includes(action)) return 'medium';
    if (context.suspiciousPatternDetected) return 'high';
    if (context.newDevice) return 'medium';

    return 'low';
};

const AccessLog = mongoose.model('AccessLog', accessLogSchema);

export default AccessLog;
