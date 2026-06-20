import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'File name is required'],
        trim: true
    },
    originalName: {
        type: String,
        required: true
    },
    // File is stored encrypted on disk (or in MongoDB on Vercel)
    storagePath: {
        type: String,
        required: true
    },
    // Encrypted file bytes (used on Vercel serverless instead of disk)
    encryptedData: {
        type: Buffer,
        select: false
    },
    // Encryption metadata (stored securely, NOT in file)
    encryptionKey: {
        type: String,
        required: true // AES key (base64) used to encrypt file
    },
    encryptionIV: {
        type: String,
        required: true // IV (base64) used to encrypt file
    },
    size: {
        type: Number,
        required: true // Original file size in bytes
    },
    encryptedSize: {
        type: Number,
        required: true // Encrypted file size in bytes
    },
    mimeType: {
        type: String,
        default: 'application/octet-stream'
    },
    // File metadata
    hash: {
        type: String,
        required: true // SHA-256 of original file (for integrity)
    },
    category: {
        type: String,
        enum: ['document', 'image', 'video', 'audio', 'archive', 'other'],
        default: 'other'
    },
    description: {
        type: String,
        default: '',
        maxlength: 500
    },
    tags: [{
        type: String,
        trim: true
    }],
    // Ownership
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Sharing
    isPublic: {
        type: Boolean,
        default: false
    },
    sharedWith: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        permissions: {
            type: String,
            enum: ['view', 'download', 'edit'],
            default: 'view'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Stats
    downloadCount: {
        type: Number,
        default: 0
    },
    lastAccessed: {
        type: Date,
        default: null
    },
    // Soft delete
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    // Expiration
    expiresAt: {
        type: Date,
        default: null // null means never expires
    }
}, {
    timestamps: true
});

// Indexes
fileSchema.index({ owner: 1, isDeleted: 1 });
fileSchema.index({ owner: 1, category: 1 });
fileSchema.index({ 'sharedWith.user': 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for file extension
fileSchema.virtual('extension').get(function () {
    const parts = this.name.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
});

// Pre-delete hook to clean up storage
fileSchema.pre('deleteOne', { document: true }, async function () {
    // Note: Actual file deletion should be handled in controller
    // to properly delete the encrypted file from disk
});

// Method to check if user has access
fileSchema.methods.hasAccess = function (userId, permission = 'view') {
    // Handle both populated and non-populated owner field
    const ownerId = this.owner?._id || this.owner;

    // Owner has all access
    if (ownerId && ownerId.toString() === userId.toString()) {
        return true;
    }

    // Check shared access
    const share = this.sharedWith.find(s => {
        const sharedUserId = s.user?._id || s.user;
        return sharedUserId && sharedUserId.toString() === userId.toString();
    });

    if (!share) return false;

    // Permission hierarchy: edit > download > view
    const permissionLevel = { view: 1, download: 2, edit: 3 };
    return permissionLevel[share.permissions] >= permissionLevel[permission];
};

// Static method to get category from mime type
fileSchema.statics.getCategoryFromMime = function (mimeType) {
    if (!mimeType) return 'other';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') ||
        mimeType.includes('document') ||
        mimeType.includes('text/') ||
        mimeType.includes('spreadsheet') ||
        mimeType.includes('presentation')) return 'document';
    if (mimeType.includes('zip') ||
        mimeType.includes('rar') ||
        mimeType.includes('7z') ||
        mimeType.includes('tar') ||
        mimeType.includes('gzip')) return 'archive';

    return 'other';
};

const File = mongoose.model('File', fileSchema);

export default File;
