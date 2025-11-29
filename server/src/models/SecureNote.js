import mongoose from 'mongoose';

const secureNoteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Note title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    // Encrypted content (encrypted on server before storage)
    content: {
        type: String,
        required: true // Encrypted note content
    },
    // Encryption metadata
    encryptionKey: {
        type: String,
        required: true // AES key used for this note
    },
    encryptionIV: {
        type: String,
        required: true
    },
    // Owner
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Organization
    category: {
        type: String,
        enum: ['personal', 'work', 'financial', 'medical', 'other'],
        default: 'personal'
    },
    tags: [{
        type: String,
        trim: true
    }],
    color: {
        type: String,
        default: '#ffffff'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isFavorite: {
        type: Boolean,
        default: false
    },
    // Sharing
    isShared: {
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
            enum: ['view', 'edit'],
            default: 'view'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
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
        default: null
    },
    // Access tracking
    lastAccessed: {
        type: Date,
        default: null
    },
    viewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
secureNoteSchema.index({ owner: 1, isDeleted: 1 });
secureNoteSchema.index({ owner: 1, category: 1 });
secureNoteSchema.index({ owner: 1, isPinned: -1, updatedAt: -1 });
secureNoteSchema.index({ 'sharedWith.user': 1 });
secureNoteSchema.index({ tags: 1 });

// Method to check access
secureNoteSchema.methods.hasAccess = function (userId, permission = 'view') {
    // Owner has all access
    if (this.owner.toString() === userId.toString()) {
        return true;
    }

    // Check shared access
    const share = this.sharedWith.find(
        s => s.user.toString() === userId.toString()
    );

    if (!share) return false;

    if (permission === 'view') return true;
    if (permission === 'edit') return share.permissions === 'edit';

    return false;
};

// Method to track access
secureNoteSchema.methods.trackAccess = async function () {
    this.lastAccessed = new Date();
    this.viewCount += 1;
    await this.save();
};

// Soft delete method
secureNoteSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
};

// Restore from soft delete
secureNoteSchema.methods.restore = async function () {
    this.isDeleted = false;
    this.deletedAt = null;
    await this.save();
};

const SecureNote = mongoose.model('SecureNote', secureNoteSchema);

export default SecureNote;
