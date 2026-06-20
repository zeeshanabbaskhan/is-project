import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { isServerlessStorage } from '../utils/storage.js';

const uploadDir = process.env.UPLOAD_PATH || './uploads';

if (!isServerlessStorage()) {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create user-specific directory
        const userDir = path.join(uploadDir, req.userId?.toString() || 'anonymous');
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with random string
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}.enc`); // .enc indicates encrypted
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Block dangerous file types
    const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (blockedExtensions.includes(ext)) {
        cb(new Error(`File type ${ext} is not allowed`), false);
        return;
    }

    cb(null, true);
};

// Configure multer
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024; // 100MB default

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: maxFileSize,
        files: 10 // Max files per request
    }
});

// Single file upload
export const uploadSingle = upload.single('file');

// Multiple files upload
export const uploadMultiple = upload.array('files', 10);

// Handle multer errors
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 10 files per request.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    next();
};

// Memory storage for encrypted uploads (client encrypts before upload)
const memoryStorage = multer.memoryStorage();

export const uploadToMemory = multer({
    storage: memoryStorage,
    fileFilter,
    limits: {
        fileSize: maxFileSize,
        files: 10
    }
});

// For encrypted file uploads - file comes pre-encrypted from client
export const uploadEncrypted = uploadToMemory.single('file');
export const uploadEncryptedMultiple = uploadToMemory.array('files', 10);
