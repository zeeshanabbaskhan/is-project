import { SecureNote, User } from '../models/index.js';
import { aesEncrypt, aesDecrypt, generateAESKey, generateIV } from '../utils/crypto.js';

/**
 * Create a new secure note
 */
export const createNote = async (req, res) => {
    try {
        const { title, content, category, tags, color, isPinned } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Encrypt note content
        const key = generateAESKey();
        const iv = generateIV();
        const { ciphertext, authTag } = aesEncrypt(content, key, iv);

        // Combine ciphertext and authTag for storage
        const encryptedContent = Buffer.concat([authTag, ciphertext]).toString('base64');

        // Create note
        const note = await SecureNote.create({
            title,
            content: encryptedContent,
            encryptionKey: key.toString('base64'),
            encryptionIV: iv.toString('base64'),
            owner: req.userId,
            category: category || 'personal',
            tags: tags || [],
            color: color || '#ffffff',
            isPinned: isPinned || false
        });

        res.status(201).json({
            success: true,
            message: 'Note created successfully',
            note: {
                id: note._id,
                title: note.title,
                category: note.category,
                tags: note.tags,
                color: note.color,
                isPinned: note.isPinned,
                createdAt: note.createdAt
            }
        });
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create note'
        });
    }
};

/**
 * Get user's notes
 */
export const getNotes = async (req, res) => {
    try {
        const { category, search, sort = '-isPinned -updatedAt' } = req.query;

        const query = {
            owner: req.userId,
            isDeleted: false
        };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        const notes = await SecureNote.find(query)
            .sort(sort)
            .select('-content -encryptionKey -encryptionIV')
            .lean();

        res.json({
            success: true,
            notes
        });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notes'
        });
    }
};

/**
 * Get and decrypt a specific note
 */
export const getNote = async (req, res) => {
    try {
        const note = await SecureNote.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        // Check access
        if (!note.hasAccess(req.userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Decrypt content
        const key = Buffer.from(note.encryptionKey, 'base64');
        const iv = Buffer.from(note.encryptionIV, 'base64');
        const encryptedData = Buffer.from(note.content, 'base64');

        // Extract authTag (first 16 bytes) and ciphertext
        const authTag = encryptedData.slice(0, 16);
        const ciphertext = encryptedData.slice(16);

        const decryptedContent = aesDecrypt(ciphertext, key, iv, authTag);

        // Track access
        await note.trackAccess();

        res.json({
            success: true,
            note: {
                id: note._id,
                title: note.title,
                content: decryptedContent.toString('utf8'),
                category: note.category,
                tags: note.tags,
                color: note.color,
                isPinned: note.isPinned,
                isFavorite: note.isFavorite,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
                viewCount: note.viewCount
            }
        });
    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get note'
        });
    }
};

/**
 * Update a note
 */
export const updateNote = async (req, res) => {
    try {
        const { title, content, category, tags, color, isPinned, isFavorite } = req.body;
        const note = await SecureNote.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        // Check access
        if (!note.hasAccess(req.userId, 'edit')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update fields
        if (title) note.title = title;
        if (category) note.category = category;
        if (tags !== undefined) note.tags = tags;
        if (color) note.color = color;
        if (isPinned !== undefined) note.isPinned = isPinned;
        if (isFavorite !== undefined) note.isFavorite = isFavorite;

        // Re-encrypt content if changed
        if (content) {
            const key = generateAESKey();
            const iv = generateIV();
            const { ciphertext, authTag } = aesEncrypt(content, key, iv);
            const encryptedContent = Buffer.concat([authTag, ciphertext]).toString('base64');

            note.content = encryptedContent;
            note.encryptionKey = key.toString('base64');
            note.encryptionIV = iv.toString('base64');
        }

        await note.save();

        res.json({
            success: true,
            message: 'Note updated successfully',
            note: {
                id: note._id,
                title: note.title,
                category: note.category,
                tags: note.tags,
                color: note.color,
                isPinned: note.isPinned,
                updatedAt: note.updatedAt
            }
        });
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update note'
        });
    }
};

/**
 * Delete a note
 */
export const deleteNote = async (req, res) => {
    try {
        const note = await SecureNote.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        // Check ownership
        if (note.owner.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Soft delete or hard delete
        if (req.query.permanent === 'true') {
            await note.deleteOne();
        } else {
            await note.softDelete();
        }

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete note'
        });
    }
};

/**
 * Share a note with another user
 */
export const shareNote = async (req, res) => {
    try {
        const { userEmail, permissions = 'view' } = req.body;
        const note = await SecureNote.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        if (note.owner.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Find user to share with
        const targetUser = await User.findOne({ email: userEmail.toLowerCase() });

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already shared
        const existingShare = note.sharedWith.find(
            s => s.user.toString() === targetUser._id.toString()
        );

        if (existingShare) {
            existingShare.permissions = permissions;
        } else {
            note.sharedWith.push({
                user: targetUser._id,
                permissions
            });
        }

        note.isShared = true;
        await note.save();

        res.json({
            success: true,
            message: 'Note shared successfully'
        });
    } catch (error) {
        console.error('Share note error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to share note'
        });
    }
};
