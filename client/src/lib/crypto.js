/**
 * Cryptographic utilities for secure communication over HTTP
 * Uses RSA + AES hybrid encryption for confidentiality
 * 
 * Flow:
 * 1. Client generates AES session key
 * 2. Client encrypts data with AES
 * 3. Client encrypts AES key with server's RSA public key
 * 4. Server decrypts AES key with RSA private key
 * 5. Server decrypts data with AES key
 */

// ============================================
// AES ENCRYPTION (Symmetric - for data)
// ============================================

/**
 * Generate a random AES-256 key
 * @returns {Promise<CryptoKey>} AES key
 */
export async function generateAESKey() {
    return await window.crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256
        },
        true, // extractable
        ['encrypt', 'decrypt']
    )
}

/**
 * Generate a random Initialization Vector (IV)
 * @returns {Uint8Array} 12-byte IV for AES-GCM
 */
export function generateIV() {
    return window.crypto.getRandomValues(new Uint8Array(12))
}

/**
 * Encrypt data using AES-GCM
 * @param {string} plaintext - Data to encrypt
 * @param {CryptoKey} aesKey - AES key
 * @param {Uint8Array} iv - Initialization vector
 * @returns {Promise<ArrayBuffer>} Encrypted data
 */
export async function encryptAES(plaintext, aesKey, iv) {
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    return await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        aesKey,
        data
    )
}

/**
 * Decrypt data using AES-GCM
 * @param {ArrayBuffer} ciphertext - Encrypted data
 * @param {CryptoKey} aesKey - AES key
 * @param {Uint8Array} iv - Initialization vector
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decryptAES(ciphertext, aesKey, iv) {
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        aesKey,
        ciphertext
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
}

/**
 * Export AES key to raw bytes
 * @param {CryptoKey} aesKey - AES key to export
 * @returns {Promise<ArrayBuffer>} Raw key bytes
 */
export async function exportAESKey(aesKey) {
    return await window.crypto.subtle.exportKey('raw', aesKey)
}

/**
 * Import AES key from raw bytes
 * @param {ArrayBuffer} rawKey - Raw key bytes
 * @returns {Promise<CryptoKey>} AES CryptoKey
 */
export async function importAESKey(rawKey) {
    return await window.crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    )
}

// ============================================
// RSA ENCRYPTION (Asymmetric - for key exchange)
// ============================================

/**
 * Generate RSA key pair for client
 * @returns {Promise<CryptoKeyPair>} RSA key pair
 */
export async function generateRSAKeyPair() {
    return await window.crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]), // 65537
            hash: 'SHA-256'
        },
        true, // extractable
        ['encrypt', 'decrypt']
    )
}

/**
 * Export RSA public key to PEM format
 * @param {CryptoKey} publicKey - RSA public key
 * @returns {Promise<string>} PEM-formatted public key
 */
export async function exportPublicKeyPEM(publicKey) {
    const exported = await window.crypto.subtle.exportKey('spki', publicKey)
    const base64 = arrayBufferToBase64(exported)
    return `-----BEGIN PUBLIC KEY-----\n${formatPEM(base64)}\n-----END PUBLIC KEY-----`
}

/**
 * Import RSA public key from PEM format
 * @param {string} pem - PEM-formatted public key
 * @returns {Promise<CryptoKey>} RSA public key
 */
export async function importPublicKeyPEM(pem) {
    // Remove PEM headers and whitespace
    const pemContents = pem
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s/g, '')

    const binaryDer = base64ToArrayBuffer(pemContents)

    return await window.crypto.subtle.importKey(
        'spki',
        binaryDer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        true,
        ['encrypt']
    )
}

/**
 * Encrypt data with RSA public key (for encrypting AES keys)
 * @param {ArrayBuffer} data - Data to encrypt (AES key)
 * @param {CryptoKey} publicKey - RSA public key
 * @returns {Promise<ArrayBuffer>} Encrypted data
 */
export async function encryptRSA(data, publicKey) {
    return await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        data
    )
}

/**
 * Decrypt data with RSA private key
 * @param {ArrayBuffer} ciphertext - Encrypted data
 * @param {CryptoKey} privateKey - RSA private key
 * @returns {Promise<ArrayBuffer>} Decrypted data
 */
export async function decryptRSA(ciphertext, privateKey) {
    return await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        ciphertext
    )
}

// ============================================
// HYBRID ENCRYPTION (RSA + AES)
// ============================================

/**
 * Encrypt message using hybrid encryption (AES for data, RSA for key)
 * @param {string|object} message - Message to encrypt
 * @param {CryptoKey} serverPublicKey - Server's RSA public key
 * @returns {Promise<object>} Encrypted package with encryptedKey, iv, and encryptedData
 */
export async function hybridEncrypt(message, serverPublicKey) {
    // Convert object to string if needed
    const plaintext = typeof message === 'object' ? JSON.stringify(message) : message

    // 1. Generate random AES key and IV
    const aesKey = await generateAESKey()
    const iv = generateIV()

    // 2. Encrypt data with AES
    const encryptedData = await encryptAES(plaintext, aesKey, iv)

    // 3. Export AES key and encrypt with RSA
    const rawAESKey = await exportAESKey(aesKey)
    const encryptedKey = await encryptRSA(rawAESKey, serverPublicKey)

    // 4. Return encrypted package
    return {
        encryptedKey: arrayBufferToBase64(encryptedKey),
        iv: arrayBufferToBase64(iv),
        encryptedData: arrayBufferToBase64(encryptedData)
    }
}

/**
 * Decrypt message using hybrid encryption
 * @param {object} encryptedPackage - Package with encryptedKey, iv, encryptedData
 * @param {CryptoKey} clientPrivateKey - Client's RSA private key
 * @returns {Promise<string>} Decrypted message
 */
export async function hybridDecrypt(encryptedPackage, clientPrivateKey) {
    const { encryptedKey, iv, encryptedData } = encryptedPackage

    // 1. Decrypt AES key with RSA
    const rawAESKey = await decryptRSA(
        base64ToArrayBuffer(encryptedKey),
        clientPrivateKey
    )

    // 2. Import AES key
    const aesKey = await importAESKey(rawAESKey)

    // 3. Decrypt data with AES
    const plaintext = await decryptAES(
        base64ToArrayBuffer(encryptedData),
        aesKey,
        base64ToArrayBuffer(iv)
    )

    return plaintext
}

// ============================================
// FILE ENCRYPTION
// ============================================

/**
 * Encrypt a file using AES-GCM
 * @param {File} file - File to encrypt
 * @param {CryptoKey} aesKey - AES key (optional, will generate if not provided)
 * @returns {Promise<{encryptedBlob: Blob, key: string, iv: string}>}
 */
export async function encryptFile(file, aesKey = null) {
    // Generate key if not provided
    if (!aesKey) {
        aesKey = await generateAESKey()
    }

    const iv = generateIV()

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer()

    // Encrypt file data
    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        aesKey,
        fileData
    )

    // Export key for storage
    const rawKey = await exportAESKey(aesKey)

    return {
        encryptedBlob: new Blob([encryptedData], { type: 'application/octet-stream' }),
        key: arrayBufferToBase64(rawKey),
        iv: arrayBufferToBase64(iv)
    }
}

/**
 * Decrypt a file using AES-GCM
 * @param {Blob} encryptedBlob - Encrypted file blob
 * @param {string} keyBase64 - Base64-encoded AES key
 * @param {string} ivBase64 - Base64-encoded IV
 * @param {string} originalType - Original MIME type of file
 * @returns {Promise<Blob>} Decrypted file blob
 */
export async function decryptFile(encryptedBlob, keyBase64, ivBase64, originalType) {
    // Import AES key
    const rawKey = base64ToArrayBuffer(keyBase64)
    const aesKey = await importAESKey(rawKey)

    // Convert IV
    const iv = base64ToArrayBuffer(ivBase64)

    // Read encrypted blob
    const encryptedData = await encryptedBlob.arrayBuffer()

    // Decrypt
    const decryptedData = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: new Uint8Array(iv)
        },
        aesKey,
        encryptedData
    )

    return new Blob([decryptedData], { type: originalType })
}

// ============================================
// HASHING
// ============================================

/**
 * Compute SHA-256 hash of data
 * @param {string|ArrayBuffer} data - Data to hash
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function sha256(data) {
    let buffer
    if (typeof data === 'string') {
        buffer = new TextEncoder().encode(data)
    } else {
        buffer = data
    }

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer)
    return arrayBufferToHex(hashBuffer)
}

/**
 * Compute SHA-256 hash of a file
 * @param {File} file - File to hash
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function hashFile(file) {
    const buffer = await file.arrayBuffer()
    return await sha256(buffer)
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
export function base64ToArrayBuffer(base64) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
}

/**
 * Convert ArrayBuffer to Hex string
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function arrayBufferToHex(buffer) {
    const bytes = new Uint8Array(buffer)
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

/**
 * Convert Hex string to ArrayBuffer
 * @param {string} hex
 * @returns {ArrayBuffer}
 */
export function hexToArrayBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    return bytes.buffer
}

/**
 * Format base64 string for PEM (64 chars per line)
 * @param {string} base64
 * @returns {string}
 */
function formatPEM(base64) {
    const lines = []
    for (let i = 0; i < base64.length; i += 64) {
        lines.push(base64.slice(i, i + 64))
    }
    return lines.join('\n')
}

// ============================================
// KEY STORAGE (LocalStorage with encryption)
// ============================================

const CLIENT_KEYS_STORAGE_KEY = 'securetransfer_client_keys'

/**
 * Store client RSA key pair securely
 * Note: In production, consider using IndexedDB or more secure storage
 * @param {CryptoKeyPair} keyPair
 */
export async function storeClientKeyPair(keyPair) {
    const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey)
    const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey)

    const keysData = {
        publicKey: publicKeyJwk,
        privateKey: privateKeyJwk,
        createdAt: Date.now()
    }

    localStorage.setItem(CLIENT_KEYS_STORAGE_KEY, JSON.stringify(keysData))
}

/**
 * Retrieve client RSA key pair from storage
 * @returns {Promise<CryptoKeyPair|null>}
 */
export async function getClientKeyPair() {
    const stored = localStorage.getItem(CLIENT_KEYS_STORAGE_KEY)
    if (!stored) return null

    try {
        const keysData = JSON.parse(stored)

        const publicKey = await window.crypto.subtle.importKey(
            'jwk',
            keysData.publicKey,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true,
            ['encrypt']
        )

        const privateKey = await window.crypto.subtle.importKey(
            'jwk',
            keysData.privateKey,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true,
            ['decrypt']
        )

        return { publicKey, privateKey }
    } catch (error) {
        console.error('Failed to load client keys:', error)
        return null
    }
}

/**
 * Clear client keys from storage
 */
export function clearClientKeys() {
    localStorage.removeItem(CLIENT_KEYS_STORAGE_KEY)
}

/**
 * Initialize or retrieve client key pair
 * @returns {Promise<CryptoKeyPair>}
 */
export async function initializeClientKeys() {
    let keyPair = await getClientKeyPair()

    if (!keyPair) {
        console.log('Generating new client RSA key pair...')
        keyPair = await generateRSAKeyPair()
        await storeClientKeyPair(keyPair)
        console.log('Client key pair generated and stored')
    }

    return keyPair
}
