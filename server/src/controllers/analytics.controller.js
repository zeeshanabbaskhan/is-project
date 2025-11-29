import { AccessLog, File, ShareLink } from '../models/index.js';

/**
 * Get user's recent activity
 */
export const getActivity = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const activity = await AccessLog.getRecentActivity(req.userId, parseInt(limit));

        res.json({
            success: true,
            activity
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get activity'
        });
    }
};

/**
 * Get activity summary
 */
export const getSummary = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const summary = await AccessLog.getActivitySummary(req.userId, parseInt(days));

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get summary'
        });
    }
};

/**
 * Get file-specific activity
 */
export const getFileActivity = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        if (file.owner.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const activity = await AccessLog.getFileActivity(req.params.id);

        res.json({
            success: true,
            activity,
            stats: {
                downloadCount: file.downloadCount,
                lastAccessed: file.lastAccessed,
                createdAt: file.createdAt
            }
        });
    } catch (error) {
        console.error('Get file activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get file activity'
        });
    }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const last24h = new Date(now - 24 * 60 * 60 * 1000);
        const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

        // Total files
        const totalFiles = await File.countDocuments({
            owner: req.userId,
            isDeleted: false
        });

        // Files uploaded in periods
        const filesLast24h = await File.countDocuments({
            owner: req.userId,
            isDeleted: false,
            createdAt: { $gte: last24h }
        });

        const filesLast7d = await File.countDocuments({
            owner: req.userId,
            isDeleted: false,
            createdAt: { $gte: last7d }
        });

        // Active share links
        const activeShares = await ShareLink.countDocuments({
            createdBy: req.userId,
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: now } }
            ]
        });

        // Recent downloads
        const downloadsLast24h = await AccessLog.countDocuments({
            user: req.userId,
            action: 'file_download',
            createdAt: { $gte: last24h }
        });

        const downloadsLast7d = await AccessLog.countDocuments({
            user: req.userId,
            action: 'file_download',
            createdAt: { $gte: last7d }
        });

        // Storage by category
        const storageByCategory = await File.aggregate([
            {
                $match: {
                    owner: req.user._id,
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalSize: { $sum: '$size' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Recent activity trend (last 7 days)
        const activityTrend = await AccessLog.aggregate([
            {
                $match: {
                    user: req.user._id,
                    createdAt: { $gte: last7d }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Most accessed files
        const topFiles = await File.find({
            owner: req.userId,
            isDeleted: false
        })
            .sort({ downloadCount: -1 })
            .limit(5)
            .select('name downloadCount category lastAccessed')
            .lean();

        res.json({
            success: true,
            stats: {
                files: {
                    total: totalFiles,
                    last24h: filesLast24h,
                    last7d: filesLast7d
                },
                shares: {
                    active: activeShares
                },
                downloads: {
                    last24h: downloadsLast24h,
                    last7d: downloadsLast7d
                },
                storage: {
                    used: req.user.storageUsed,
                    limit: req.user.storageLimit,
                    percentage: Math.round((req.user.storageUsed / req.user.storageLimit) * 100),
                    byCategory: storageByCategory
                },
                activityTrend,
                topFiles
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard statistics'
        });
    }
};

/**
 * Get security-related analytics
 */
export const getSecurityAnalytics = async (req, res) => {
    try {
        const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Failed login attempts
        const failedLogins = await AccessLog.countDocuments({
            user: req.userId,
            action: 'failed_login',
            createdAt: { $gte: last30d }
        });

        // Unique IPs
        const uniqueIPs = await AccessLog.distinct('ip', {
            user: req.userId,
            createdAt: { $gte: last30d }
        });

        // High-risk activities
        const highRiskActivities = await AccessLog.find({
            user: req.userId,
            riskLevel: { $in: ['high', 'critical'] },
            createdAt: { $gte: last30d }
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Recent login locations
        const recentLogins = await AccessLog.find({
            user: req.userId,
            action: 'login',
            success: true
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('ip location createdAt')
            .lean();

        res.json({
            success: true,
            security: {
                failedLogins,
                uniqueIPCount: uniqueIPs.length,
                highRiskActivities,
                recentLogins
            }
        });
    } catch (error) {
        console.error('Get security analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get security analytics'
        });
    }
};
