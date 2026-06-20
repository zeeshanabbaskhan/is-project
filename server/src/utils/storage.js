/**
 * File storage abstraction
 * Uses MongoDB for encrypted blobs on Vercel, filesystem elsewhere
 */

import fs from 'fs';
import path from 'path';
import {
    encryptFile,
    encryptFileToBuffer,
    decryptFile,
    decryptFileBuffer,
    deleteEncryptedFile
} from './crypto.js';

export const isServerlessStorage = () => Boolean(process.env.VERCEL);

export function storeEncryptedFile(fileBuffer, userId) {
    if (isServerlessStorage()) {
        const { encryptedData, key, iv } = encryptFileToBuffer(fileBuffer);
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}.enc`;

        return {
            storagePath: `vercel:mongo://${userId}/${uniqueName}`,
            encryptedData,
            encryptionKey: key,
            encryptionIV: iv,
            encryptedSize: encryptedData.length
        };
    }

    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const userDir = path.join(uploadDir, userId.toString());
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}.enc`;
    const storagePath = path.join(userDir, uniqueName);
    const { key, iv } = encryptFile(fileBuffer, storagePath);

    return {
        storagePath,
        encryptionKey: key,
        encryptionIV: iv,
        encryptedSize: fs.statSync(storagePath).size
    };
}

export function readDecryptedFile(file) {
    if (file.encryptedData) {
        return decryptFileBuffer(file.encryptedData, file.encryptionKey, file.encryptionIV);
    }
    return decryptFile(file.storagePath, file.encryptionKey, file.encryptionIV);
}

export function removeStoredFile(file) {
    if (file.encryptedData) {
        return;
    }
    deleteEncryptedFile(file.storagePath);
}

export const sensitiveFileFields = '-encryptionKey -encryptionIV -storagePath -encryptedData';
