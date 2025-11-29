import fs from 'fs';
import path from 'path';
import { File, User, ShareLink, AccessLog } from '../models/index.js';
import { encryptFile, decryptFile, deleteEncryptedFile, sha256 } from '../utils/crypto.js';

/**
 * Upload encrypted file
 */
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { name, description, tags, category } = req.body;
        const user = await User.findById(req.userId);

        // Check storage limit
        if (user.storageUsed + req.file.size > user.storageLimit) {
            return res.status(400).json({
                success: false,
                message: 'Storage limit exceeded'
            });
        }

        // Create user directory
        const uploadDir = process.env.UPLOAD_PATH || './uploads';
        const userDir = path.join(uploadDir, req.userId.toString());
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        // Generate unique filename
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}.enc`;
        const storagePath = path.join(userDir, uniqueName);

        // Encrypt and save file
        const { key, iv } = encryptFile(req.file.buffer, storagePath);

        // Calculate hash of original file
        const hash = sha256(req.file.buffer);

        // Determine category from mimetype
        const fileCategory = category || File.getCategoryFromMime(req.file.mimetype);

        // Create file record
        const file = await File.create({
            name: name || req.file.originalname,
            originalName: req.file.originalname,
            storagePath,
            encryptionKey: key,
            encryptionIV: iv,
            size: req.file.size,
            encryptedSize: fs.statSync(storagePath).size,
            mimeType: req.file.mimetype,
            hash,
            category: fileCategory,
            description: description || '',
            tags: tags ? JSON.parse(tags) : [],
            owner: req.userId
        });

        // Update user storage
        user.storageUsed += req.file.size;
        await user.save();

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                id: file._id,
                name: file.name,
                size: file.size,
                mimeType: file.mimeType,
                category: file.category,
                createdAt: file.createdAt
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file'
        });
    }
};

/**
 * Get user's files
 */
export const getFiles = async (req, res) => {
    try {
        const { category, search, sort = '-createdAt', page = 1, limit = 50 } = req.query;

        const query = {
            owner: req.userId,
            isDeleted: false
        };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        const files = await File.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-encryptionKey -encryptionIV -storagePath')
            .lean();

        const total = await File.countDocuments(query);

        res.json({
            success: true,
            files,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get files'
        });
    }
};

/**
 * Get file details
 */
export const getFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('sharedWith.user', 'name email')
            .select('-encryptionKey -encryptionIV -storagePath');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Check access
        if (!file.hasAccess(req.userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if user is the owner (handle both populated and non-populated)
        const ownerId = file.owner?._id || file.owner;
        const isOwner = ownerId && ownerId.toString() === req.userId.toString();

        // If owner, get share links and access logs
        let shareLinks = [];
        let accessLogs = [];

        if (isOwner) {
            // Get share links for this file
            shareLinks = await ShareLink.find({ file: req.params.id })
                .select('token recipientEmail permissions downloadCount viewCount createdAt expiresAt isActive')
                .lean();

            // Get access logs for this file
            accessLogs = await AccessLog.find({
                resourceId: req.params.id,
                resourceType: 'file'
            })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean();
        }

        res.json({
            success: true,
            file,
            isOwner,
            shareLinks: isOwner ? shareLinks : undefined,
            accessLogs: isOwner ? accessLogs : undefined
        });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get file'
        });
    }
};

/**
 * Get file preview (for viewing in browser)
 */
export const previewFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Check access
        if (!file.hasAccess(req.userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Decrypt file
        const decryptedData = decryptFile(file.storagePath, file.encryptionKey, file.encryptionIV);

        // Update last accessed
        file.lastAccessed = new Date();
        await file.save();

        // Send file for inline viewing (not download)
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
        res.setHeader('Content-Length', file.size);
        res.send(decryptedData);
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to preview file'
        });
    }
};

/**
 * Download and decrypt file
 */
export const downloadFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Check access
        if (!file.hasAccess(req.userId, 'download')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Decrypt file
        const decryptedData = decryptFile(file.storagePath, file.encryptionKey, file.encryptionIV);

        // Update stats
        file.downloadCount += 1;
        file.lastAccessed = new Date();
        await file.save();

        // Send file
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.setHeader('Content-Length', file.size);
        res.send(decryptedData);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download file'
        });
    }
};

/**
 * Update file metadata
 */
export const updateFile = async (req, res) => {
    try {
        const { name, description, tags, category } = req.body;
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Check ownership
        if (file.owner.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (name) file.name = name;
        if (description !== undefined) file.description = description;
        if (tags) file.tags = tags;
        if (category) file.category = category;

        await file.save();

        res.json({
            success: true,
            message: 'File updated successfully',
            file
        });
    } catch (error) {
        console.error('Update file error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update file'
        });
    }
};

/**
 * Delete file
 */
export const deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Check ownership
        if (file.owner.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Delete encrypted file from disk
        deleteEncryptedFile(file.storagePath);

        // Update user storage
        const user = await User.findById(req.userId);
        user.storageUsed = Math.max(0, user.storageUsed - file.size);
        await user.save();

        // Soft delete or hard delete
        if (req.query.permanent === 'true') {
            await file.deleteOne();
        } else {
            file.isDeleted = true;
            file.deletedAt = new Date();
            await file.save();
        }

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file'
        });
    }
};

/**
 * Get files shared WITH the current user (for inbox)
 */
export const getSharedWithMe = async (req, res) => {
    try {
        const files = await File.find({
            'sharedWith.user': req.userId,
            isDeleted: false
        })
            .populate('owner', 'name email')
            .select('-encryptionKey -encryptionIV -storagePath')
            .sort({ createdAt: -1 })
            .lean();

        // Add sharedAt and permissions info for each file
        const filesWithShareInfo = files.map(file => {
            const shareInfo = file.sharedWith.find(
                s => s.user && s.user.toString() === req.userId.toString()
            );
            return {
                ...file,
                sharedAt: shareInfo?.sharedAt,
                permissions: shareInfo?.permissions || 'view',
                sharedBy: file.owner?.email
            };
        });

        res.json({
            success: true,
            files: filesWithShareInfo
        });
    } catch (error) {
        console.error('Get shared files error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get shared files'
        });
    }
};

/**
 * Remove a shared user from a file
 */
export const removeSharedUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const file = await File.findOne({
            _id: id,
            owner: req.userId
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found or you do not have permission'
            });
        }

        // Find and remove the shared user
        const initialLength = file.sharedWith.length;
        file.sharedWith = file.sharedWith.filter(
            share => share.user.toString() !== userId
        );

        if (file.sharedWith.length === initialLength) {
            return res.status(404).json({
                success: false,
                message: 'User not found in shared list'
            });
        }

        await file.save();

        res.json({
            success: true,
            message: 'User removed from shared list'
        });
    } catch (error) {
        console.error('Remove shared user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove shared user'
        });
    }
};

/**
 * Get file statistics
 */
export const getFileStats = async (req, res) => {
    try {
        const stats = await File.aggregate([
            {
                $match: {
                    owner: req.user._id,
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$size' }
                }
            }
        ]);

        const totalFiles = await File.countDocuments({
            owner: req.userId,
            isDeleted: false
        });

        res.json({
            success: true,
            stats: {
                byCategory: stats,
                totalFiles,
                storageUsed: req.user.storageUsed,
                storageLimit: req.user.storageLimit
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics'
        });
    }
};
