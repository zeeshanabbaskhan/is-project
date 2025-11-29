/**
 * Cryptographic utilities for server-side RSA+AES encryption
 * Ensures confidentiality over HTTP
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Key storage paths
const KEYS_DIR = path.join(__dirname, '..', '..', 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'server_private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'server_public.pem');

// In-memory storage for client public keys (per session)
const clientPublicKeys = new Map();

// ============================================
// SERVER RSA KEY MANAGEMENT
// ============================================

/**
 * Generate server RSA key pair if not exists
 */
export function initializeServerKeys() {
    // Create keys directory if needed
    if (!fs.existsSync(KEYS_DIR)) {
        fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    // Check if keys exist
    if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
        console.log('🔑 Server RSA keys loaded');
        return;
    }

    // Generate new key pair
    console.log('🔑 Generating server RSA key pair...');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
    console.log('✅ Server RSA keys generated and saved');
}

/**
 * Get server's public key (PEM format)
 */
export function getServerPublicKey() {
    if (!fs.existsSync(PUBLIC_KEY_PATH)) {
        initializeServerKeys();
    }
    return fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
}

/**
 * Get server's private key (PEM format)
 */
export function getServerPrivateKey() {
    if (!fs.existsSync(PRIVATE_KEY_PATH)) {
        initializeServerKeys();
    }
    return fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
}

// ============================================
// CLIENT KEY MANAGEMENT
// ============================================

/**
 * Store client's public key for a session
 * @param {string} sessionId - Session identifier
 * @param {string} publicKeyPEM - Client's public key in PEM format
 */
export function storeClientPublicKey(sessionId, publicKeyPEM) {
    clientPublicKeys.set(sessionId, publicKeyPEM);
}

/**
 * Get client's public key for a session
 * @param {string} sessionId - Session identifier
 * @returns {string|null} Client's public key or null
 */
export function getClientPublicKey(sessionId) {
    return clientPublicKeys.get(sessionId) || null;
}

/**
 * Remove client's public key (on logout)
 * @param {string} sessionId - Session identifier
 */
export function removeClientPublicKey(sessionId) {
    clientPublicKeys.delete(sessionId);
}

// ============================================
// RSA ENCRYPTION/DECRYPTION
// ============================================

/**
 * Decrypt data with server's private key
 * @param {string} encryptedBase64 - Base64-encoded encrypted data
 * @returns {Buffer} Decrypted data
 */
export function rsaDecrypt(encryptedBase64) {
    const privateKey = getServerPrivateKey();
    const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');

    return crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        encryptedBuffer
    );
}

/**
 * Encrypt data with client's public key
 * @param {Buffer} data - Data to encrypt
 * @param {string} clientPublicKeyPEM - Client's public key
 * @returns {string} Base64-encoded encrypted data
 */
export function rsaEncrypt(data, clientPublicKeyPEM) {
    const encrypted = crypto.publicEncrypt(
        {
            key: clientPublicKeyPEM,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        data
    );

    return encrypted.toString('base64');
}

// ============================================
// AES ENCRYPTION/DECRYPTION
// ============================================

/**
 * Generate random AES-256 key
 * @returns {Buffer} 32-byte key
 */
export function generateAESKey() {
    return crypto.randomBytes(32);
}

/**
 * Generate random IV for AES-GCM
 * @returns {Buffer} 12-byte IV
 */
export function generateIV() {
    return crypto.randomBytes(12);
}

/**
 * Encrypt data with AES-256-GCM
 * @param {string|Buffer} data - Data to encrypt
 * @param {Buffer} key - AES key
 * @param {Buffer} iv - Initialization vector
 * @returns {{ciphertext: Buffer, authTag: Buffer}} Encrypted data and auth tag
 */
export function aesEncrypt(data, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted;
    if (typeof data === 'string') {
        encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    } else {
        encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    }

    return {
        ciphertext: encrypted,
        authTag: cipher.getAuthTag()
    };
}

/**
 * Decrypt data with AES-256-GCM
 * @param {Buffer} ciphertext - Encrypted data
 * @param {Buffer} key - AES key
 * @param {Buffer} iv - Initialization vector
 * @param {Buffer} authTag - Authentication tag
 * @returns {Buffer} Decrypted data
 */
export function aesDecrypt(ciphertext, key, iv, authTag) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// ============================================
// HYBRID ENCRYPTION (RSA + AES)
// ============================================

/**
 * Decrypt a hybrid-encrypted message from client
 * @param {object} encryptedPackage - {encryptedKey, iv, encryptedData}
 * @returns {string} Decrypted plaintext
 */
export function hybridDecrypt(encryptedPackage) {
    const { encryptedKey, iv, encryptedData } = encryptedPackage;

    // 1. Decrypt AES key with RSA
    const aesKey = rsaDecrypt(encryptedKey);

    // 2. Prepare IV and ciphertext
    const ivBuffer = Buffer.from(iv, 'base64');
    const ciphertextWithTag = Buffer.from(encryptedData, 'base64');

    // AES-GCM auth tag is last 16 bytes
    const authTag = ciphertextWithTag.slice(-16);
    const ciphertext = ciphertextWithTag.slice(0, -16);

    // 3. Decrypt data with AES
    const decrypted = aesDecrypt(ciphertext, aesKey, ivBuffer, authTag);

    return decrypted.toString('utf8');
}

/**
 * Encrypt a message for client using hybrid encryption
 * @param {string|object} data - Data to encrypt
 * @param {string} clientPublicKeyPEM - Client's public key
 * @returns {object} {encryptedKey, iv, encryptedData}
 */
export function hybridEncrypt(data, clientPublicKeyPEM) {
    const plaintext = typeof data === 'object' ? JSON.stringify(data) : data;

    // 1. Generate random AES key and IV
    const aesKey = generateAESKey();
    const iv = generateIV();

    // 2. Encrypt data with AES
    const { ciphertext, authTag } = aesEncrypt(plaintext, aesKey, iv);

    // Combine ciphertext and auth tag
    const encryptedData = Buffer.concat([ciphertext, authTag]);

    // 3. Encrypt AES key with RSA
    const encryptedKey = rsaEncrypt(aesKey, clientPublicKeyPEM);

    return {
        encryptedKey,
        iv: iv.toString('base64'),
        encryptedData: encryptedData.toString('base64')
    };
}

// ============================================
// FILE ENCRYPTION
// ============================================

/**
 * Encrypt a file and save to disk
 * @param {Buffer} fileBuffer - File data
 * @param {string} outputPath - Path to save encrypted file
 * @returns {{key: string, iv: string}} Encryption key and IV (base64)
 */
export function encryptFile(fileBuffer, outputPath) {
    const key = generateAESKey();
    const iv = generateIV();

    const { ciphertext, authTag } = aesEncrypt(fileBuffer, key, iv);

    // Prepend auth tag to ciphertext for storage
    const encryptedData = Buffer.concat([authTag, ciphertext]);

    // Write encrypted file
    fs.writeFileSync(outputPath, encryptedData);

    return {
        key: key.toString('base64'),
        iv: iv.toString('base64')
    };
}

/**
 * Decrypt a file from disk
 * @param {string} filePath - Path to encrypted file
 * @param {string} keyBase64 - Base64-encoded AES key
 * @param {string} ivBase64 - Base64-encoded IV
 * @returns {Buffer} Decrypted file data
 */
export function decryptFile(filePath, keyBase64, ivBase64) {
    const key = Buffer.from(keyBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');

    const encryptedData = fs.readFileSync(filePath);

    // Extract auth tag (first 16 bytes)
    const authTag = encryptedData.slice(0, 16);
    const ciphertext = encryptedData.slice(16);

    return aesDecrypt(ciphertext, key, iv, authTag);
}

/**
 * Delete encrypted file from disk
 * @param {string} filePath - Path to encrypted file
 */
export function deleteEncryptedFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

// ============================================
// HASHING
// ============================================

/**
 * Compute SHA-256 hash
 * @param {string|Buffer} data - Data to hash
 * @returns {string} Hex-encoded hash
 */
export function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Compute SHA-256 hash of a file
 * @param {string} filePath - Path to file
 * @returns {string} Hex-encoded hash
 */
export function hashFile(filePath) {
    const data = fs.readFileSync(filePath);
    return sha256(data);
}

// Initialize server keys on module load
initializeServerKeys();
