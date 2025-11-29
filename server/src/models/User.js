import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    avatar: {
        type: String,
        default: null
    },
    publicKey: {
        type: String,
        default: null // Client's RSA public key for encrypted responses
    },
    // Account settings
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        default: null
    },
    // User preferences/settings
    settings: {
        privacyMode: {
            type: Boolean,
            default: false
        },
        autoLogoutMinutes: {
            type: Number,
            default: 30,
            min: 5,
            max: 120
        },
        emailNotifications: {
            type: Boolean,
            default: true
        },
        shareNotifications: {
            type: Boolean,
            default: true
        }
    },
    // Subscription
    plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free'
    },
    storageUsed: {
        type: Number,
        default: 0 // bytes
    },
    storageLimit: {
        type: Number,
        default: 5 * 1024 * 1024 * 1024 // 5GB default
    },
    // Security
    lastLogin: {
        type: Date,
        default: null
    },
    lastLoginIp: {
        type: String,
        default: null
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    // Timestamps
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
    // Reset if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        await this.updateOne({
            $set: { failedLoginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
        return;
    }

    const updates = { $inc: { failedLoginAttempts: 1 } };

    // Lock account after 5 failed attempts for 15 minutes
    if (this.failedLoginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 };
    }

    await this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function () {
    await this.updateOne({
        $set: { failedLoginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

// Virtual for storage usage percentage
userSchema.virtual('storageUsedPercent').get(function () {
    return Math.round((this.storageUsed / this.storageLimit) * 100);
});

// Remove sensitive fields from JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.twoFactorSecret;
    delete obj.emailVerificationToken;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
