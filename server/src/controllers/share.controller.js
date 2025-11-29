import { ShareLink, File, User } from '../models/index.js';
import { decryptFile } from '../utils/crypto.js';

/**
 * Create a share link for a file
 */
export const createShareLink = async (req, res) => {
    try {
        const {
            fileId,
            permissions = 'view',
            password,
            maxDownloads,
            expiresAt,
            recipientEmail,
            message,
            notifyOnAccess,
            accessMode = 'public',
            allowedUsers = [],
            oneTimeAccess = false
        } = req.body;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: 'File ID is required'
            });
        }

        // Verify file exists and user has access
        const file = await File.findById(fileId);
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

        // If recipientEmail is provided, add to file's sharedWith array
        if (recipientEmail) {
            console.log(`Sharing file ${fileId} with email: ${recipientEmail}`);
            const recipientUser = await User.findOne({ email: recipientEmail.toLowerCase() });

            if (recipientUser) {
                console.log(`Found recipient user: ${recipientUser._id}`);
                // Check if already shared with this user
                const existingShareIndex = file.sharedWith.findIndex(
                    s => s.user && s.user.toString() === recipientUser._id.toString()
                );

                if (existingShareIndex === -1) {
                    file.sharedWith.push({
                        user: recipientUser._id,
                        permissions: permissions,
                        sharedAt: new Date()
                    });
                    await file.save();
                    console.log(`Added ${recipientEmail} to sharedWith array`);
                } else {
                    // Update permissions if needed
                    file.sharedWith[existingShareIndex].permissions = permissions;
                    file.sharedWith[existingShareIndex].sharedAt = new Date();
                    await file.save();
                    console.log(`Updated existing share for ${recipientEmail}`);
                }
            } else {
                console.log(`Recipient user not found: ${recipientEmail}`);
            }
        }

        // For restricted access mode, also add allowed users to file's sharedWith
        if (accessMode === 'restricted' && allowedUsers.length > 0) {
            for (const userId of allowedUsers) {
                const existingShareIndex = file.sharedWith.findIndex(
                    s => s.user && s.user.toString() === userId.toString()
                );

                if (existingShareIndex === -1) {
                    file.sharedWith.push({
                        user: userId,
                        permissions: permissions,
                        sharedAt: new Date()
                    });
                }
            }
            await file.save();
        }

        // Create share link
        const shareData = {
            file: fileId,
            createdBy: req.userId,
            permissions,
            maxDownloads,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            recipientEmail,
            message,
            notifyOnAccess: notifyOnAccess || false,
            accessMode,
            allowedUsers: accessMode === 'restricted' ? allowedUsers : [],
            oneTimeAccess: oneTimeAccess || false
        };

        const shareLink = password
            ? await ShareLink.createWithPassword(shareData, password)
            : await ShareLink.create(shareData);

        res.status(201).json({
            success: true,
            message: 'Share link created successfully',
            shareLink: {
                id: shareLink._id,
                token: shareLink.token,
                shortCode: shareLink.shortCode,
                shareUrl: `${req.protocol}://${req.get('host')}/share/${shareLink.token}`,
                permissions: shareLink.permissions,
                expiresAt: shareLink.expiresAt,
                maxDownloads: shareLink.maxDownloads,
                isPasswordProtected: shareLink.isPasswordProtected,
                accessMode: shareLink.accessMode
            }
        });
    } catch (error) {
        console.error('Create share link error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create share link'
        });
    }
};

/**
 * Access a shared file via token
 */
export const accessShareLink = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.query;

        const shareLink = await ShareLink.findOne({ token })
            .populate('file')
            .populate('allowedUsers', 'name email');

        if (!shareLink) {
            return res.status(404).json({
                success: false,
                message: 'Share link not found'
            });
        }

        // Check if link is valid
        if (!shareLink.isValid()) {
            return res.status(403).json({
                success: false,
                message: 'Share link is expired or inactive'
            });
        }

        // Check access mode for restricted links
        if (shareLink.accessMode === 'restricted') {
            // User must be logged in for restricted links
            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    requiresAuth: true,
                    accessMode: 'restricted'
                });
            }

            // Check if user is in allowed users list or is the owner
            const isOwner = shareLink.createdBy.toString() === req.userId.toString();
            const isAllowed = shareLink.allowedUsers.some(
                user => user._id.toString() === req.userId.toString()
            );

            if (!isOwner && !isAllowed) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this file',
                    accessDenied: true
                });
            }

            // Check one-time access for restricted links
            if (shareLink.oneTimeAccess && !isOwner && shareLink.hasUserAccessed(req.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'You have already accessed this file. One-time access has been used.',
                    alreadyAccessed: true
                });
            }
        }

        // Check one-time access for public links
        if (shareLink.isOneTimePublicUsed()) {
            return res.status(403).json({
                success: false,
                message: 'This link has already been used. One-time access links can only be accessed once.',
                alreadyAccessed: true
            });
        }

        // Verify password if required
        if (shareLink.isPasswordProtected) {
            if (!password) {
                return res.status(401).json({
                    success: false,
                    message: 'Password required',
                    passwordRequired: true
                });
            }

            const isPasswordValid = await shareLink.verifyPassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password'
                });
            }
        }

        // Log access with user ID
        await shareLink.logAccess(
            req.ip,
            req.headers['user-agent'],
            'view',
            req.userId || null
        );

        // For one-time access links, mark as accessed and create session token
        let accessSessionToken = null;
        if (shareLink.oneTimeAccess) {
            if (shareLink.accessMode === 'public') {
                await shareLink.markPublicAccessed();
            } else if (req.userId) {
                const isOwner = shareLink.createdBy.toString() === req.userId.toString();
                if (!isOwner) {
                    await shareLink.markUserAccessed(req.userId);
                }
            }
            // Create access session for subsequent preview/download
            accessSessionToken = await shareLink.createAccessSession(req.userId);
        }

        // Calculate download limit info based on access mode
        let userDownloadCount = 0;
        let canDownload = true;
        let downloadLimitReached = false;

        if (shareLink.maxDownloads) {
            if (shareLink.accessMode === 'restricted' && req.userId) {
                // Per-user limit for restricted mode
                userDownloadCount = shareLink.getUserDownloadCount(req.userId);
                downloadLimitReached = userDownloadCount >= shareLink.maxDownloads;
                canDownload = !downloadLimitReached;
            } else if (shareLink.accessMode === 'public') {
                // Global limit for public mode
                downloadLimitReached = shareLink.downloadCount >= shareLink.maxDownloads;
                canDownload = !downloadLimitReached;
            }
        }

        res.json({
            success: true,
            shareLink: {
                file: {
                    id: shareLink.file._id,
                    name: shareLink.file.name,
                    size: shareLink.file.size,
                    mimeType: shareLink.file.mimeType,
                    category: shareLink.file.category
                },
                permissions: shareLink.permissions,
                message: shareLink.message,
                expiresAt: shareLink.expiresAt,
                downloadCount: shareLink.accessMode === 'restricted' ? userDownloadCount : shareLink.downloadCount,
                maxDownloads: shareLink.maxDownloads,
                accessMode: shareLink.accessMode,
                accessSessionToken, // For one-time links
                oneTimeAccess: shareLink.oneTimeAccess,
                canDownload,
                downloadLimitReached
            }
        });
    } catch (error) {
        console.error('Access share link error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to access share link'
        });
    }
};

/**
 * Download file via share link
 */
export const downloadSharedFile = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, sessionToken } = req.query;

        const shareLink = await ShareLink.findOne({ token })
            .populate('file')
            .populate('allowedUsers', '_id');

        if (!shareLink) {
            return res.status(404).json({
                success: false,
                message: 'Share link not found'
            });
        }

        if (!shareLink.isValid()) {
            return res.status(403).json({
                success: false,
                message: 'Share link is expired or inactive'
            });
        }

        // For one-time access links, verify session token
        if (shareLink.oneTimeAccess) {
            if (!shareLink.verifyAccessSession(sessionToken, req.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid or expired access session. Please access the link again.',
                    sessionExpired: true
                });
            }
        }

        // Check access mode for restricted links
        if (shareLink.accessMode === 'restricted') {
            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    requiresAuth: true
                });
            }

            const isOwner = shareLink.createdBy.toString() === req.userId.toString();
            const isAllowed = shareLink.allowedUsers.some(
                user => user._id.toString() === req.userId.toString()
            );

            if (!isOwner && !isAllowed) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this file',
                    accessDenied: true
                });
            }
        }

        // Check download permission
        if (shareLink.permissions !== 'download') {
            return res.status(403).json({
                success: false,
                message: 'Download not allowed for this share link'
            });
        }

        // Check download limit based on access mode
        if (shareLink.maxDownloads) {
            if (shareLink.accessMode === 'restricted' && req.userId) {
                // Per-user limit for restricted mode
                const isOwner = shareLink.createdBy.toString() === req.userId.toString();
                if (!isOwner && shareLink.hasUserReachedLimit(req.userId)) {
                    return res.status(403).json({
                        success: false,
                        message: 'You have reached the maximum download limit for this file.',
                        downloadLimitReached: true
                    });
                }
            } else if (shareLink.accessMode === 'public') {
                // Global limit for public mode
                if (shareLink.downloadCount >= shareLink.maxDownloads) {
                    return res.status(403).json({
                        success: false,
                        message: 'Download limit has been reached for this link.',
                        downloadLimitReached: true
                    });
                }
            }
        }

        // Verify password
        if (shareLink.isPasswordProtected) {
            const isPasswordValid = await shareLink.verifyPassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password'
                });
            }
        }

        // Decrypt and send file
        const file = shareLink.file;
        const decryptedData = decryptFile(file.storagePath, file.encryptionKey, file.encryptionIV);

        // Log download and increment counts
        await shareLink.logAccess(
            req.ip,
            req.headers['user-agent'],
            'download',
            req.userId || null
        );

        // For restricted mode, also increment per-user count
        if (shareLink.accessMode === 'restricted' && req.userId) {
            const isOwner = shareLink.createdBy.toString() === req.userId.toString();
            if (!isOwner) {
                await shareLink.incrementUserDownload(req.userId);
            }
        }

        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.setHeader('Content-Length', file.size);
        res.send(decryptedData);
    } catch (error) {
        console.error('Download via share link error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download file'
        });
    }
};

/**
 * Preview file via share link (for inline viewing)
 */
export const previewSharedFile = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, sessionToken } = req.query;

        const shareLink = await ShareLink.findOne({ token })
            .populate('file')
            .populate('allowedUsers', '_id');

        if (!shareLink) {
            return res.status(404).json({
                success: false,
                message: 'Share link not found'
            });
        }

        if (!shareLink.isValid()) {
            return res.status(403).json({
                success: false,
                message: 'Share link is expired or inactive'
            });
        }

        // For one-time access links, verify session token
        if (shareLink.oneTimeAccess) {
            if (!shareLink.verifyAccessSession(sessionToken, req.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid or expired access session. Please access the link again.',
                    sessionExpired: true
                });
            }
        }

        // Check access mode for restricted links
        if (shareLink.accessMode === 'restricted') {
            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    requiresAuth: true
                });
            }

            const isOwner = shareLink.createdBy.toString() === req.userId.toString();
            const isAllowed = shareLink.allowedUsers.some(
                user => user._id.toString() === req.userId.toString()
            );

            if (!isOwner && !isAllowed) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this file',
                    accessDenied: true
                });
            }
        }

        // Verify password if required
        if (shareLink.isPasswordProtected) {
            const isPasswordValid = await shareLink.verifyPassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password'
                });
            }
        }

        // Decrypt and send file for preview (inline)
        const file = shareLink.file;
        const decryptedData = decryptFile(file.storagePath, file.encryptionKey, file.encryptionIV);

        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
        res.setHeader('Content-Length', decryptedData.length);
        res.send(decryptedData);
    } catch (error) {
        console.error('Preview via share link error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to preview file'
        });
    }
};

/**
 * Get user's share links
 */
export const getShareLinks = async (req, res) => {
    try {
        const shareLinks = await ShareLink.find({ createdBy: req.userId })
            .populate('file', 'name size mimeType category')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            shareLinks: shareLinks.map(link => ({
                ...link,
                shareUrl: `${req.protocol}://${req.get('host')}/share/${link.token}`
            }))
        });
    } catch (error) {
        console.error('Get share links error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get share links'
        });
    }
};

/**
 * Revoke/Delete a share link
 */
export const revokeShareLink = async (req, res) => {
    try {
        const shareLink = await ShareLink.findById(req.params.id);

        if (!shareLink) {
            return res.status(404).json({
                success: false,
                message: 'Share link not found'
            });
        }

        if (shareLink.createdBy.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await shareLink.deleteOne();

        res.json({
            success: true,
            message: 'Share link deleted successfully'
        });
    } catch (error) {
        console.error('Delete share link error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete share link'
        });
    }
};

/**
 * Toggle share link active status
 */
export const toggleShareLink = async (req, res) => {
    try {
        const shareLink = await ShareLink.findById(req.params.id);

        if (!shareLink) {
            return res.status(404).json({
                success: false,
                message: 'Share link not found'
            });
        }

        if (shareLink.createdBy.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        shareLink.isActive = !shareLink.isActive;
        await shareLink.save();

        res.json({
            success: true,
            message: `Share link ${shareLink.isActive ? 'activated' : 'deactivated'}`,
            isActive: shareLink.isActive
        });
    } catch (error) {
        console.error('Toggle share link error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle share link'
        });
    }
};

/**
 * Get share link access trace/logs
 */
export const getShareLinkTrace = async (req, res) => {
    try {
        const shareLink = await ShareLink.findById(req.params.id)
            .populate('file', 'name')
            .populate('accessLog.userId', 'name email');

        if (!shareLink) {
            return res.status(404).json({
                success: false,
                message: 'Share link not found'
            });
        }

        if (shareLink.createdBy.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Format access logs for frontend
        const accessLogs = shareLink.accessLog.map(log => ({
            id: log._id,
            user: log.userId ? {
                name: log.userId.name,
                email: log.userId.email
            } : null,
            ip: log.ip || 'Unknown',
            location: {
                country: log.country || 'Unknown',
                city: log.city || 'Unknown',
                region: log.region || 'Unknown'
            },
            device: log.device || 'Unknown',
            deviceType: log.deviceType || 'desktop',
            browser: log.browser ? `${log.browser} ${log.browserVersion || ''}`.trim() : 'Unknown',
            os: log.os ? `${log.os} ${log.osVersion || ''}`.trim() : 'Unknown',
            action: log.action,
            timestamp: log.timestamp
        }));

        res.json({
            success: true,
            trace: {
                shareLinkId: shareLink._id,
                fileName: shareLink.file?.name || 'Unknown',
                token: shareLink.token,
                accessMode: shareLink.accessMode,
                totalViews: accessLogs.filter(l => l.action === 'view').length,
                totalDownloads: accessLogs.filter(l => l.action === 'download').length,
                accessLogs: accessLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            }
        });
    } catch (error) {
        console.error('Get share link trace error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get access trace'
        });
    }
};
