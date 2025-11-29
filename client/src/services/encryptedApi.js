/**
 * Encrypted API Service
 * Wraps axios with RSA+AES hybrid encryption for all requests/responses
 * Ensures confidentiality over HTTP
 */

import axios from 'axios'
import {
    hybridEncrypt,
    hybridDecrypt,
    importPublicKeyPEM,
    exportPublicKeyPEM,
    initializeClientKeys
} from '../lib/crypto'

const API_BASE_URL = 'http://localhost:5000/api'

// Server's RSA public key (will be fetched from server)
let serverPublicKey = null

// Client's RSA key pair
let clientKeyPair = null

/**
 * Initialize encryption by:
 * 1. Generating/loading client keys
 * 2. Fetching server's public key
 * 3. Sending client's public key to server
 */
export async function initializeEncryption() {
    try {
        // 1. Initialize client keys
        clientKeyPair = await initializeClientKeys()
        console.log('Client keys initialized')

        // 2. Fetch server's public key - matches backend route /api/crypto/public-key
        const serverKeyResponse = await axios.get(`${API_BASE_URL}/crypto/public-key`)
        serverPublicKey = await importPublicKeyPEM(serverKeyResponse.data.publicKey)
        console.log('Server public key loaded')

        // 3. Send client's public key to server - matches backend route /api/crypto/client-key
        const clientPublicKeyPEM = await exportPublicKeyPEM(clientKeyPair.publicKey)
        await axios.post(`${API_BASE_URL}/crypto/client-key`, {
            publicKey: clientPublicKeyPEM
        }, { withCredentials: true })
        console.log('Client public key sent to server')

        return true
    } catch (error) {
        console.error('Failed to initialize encryption:', error)
        return false
    }
}

/**
 * Check if encryption is initialized
 */
export function isEncryptionReady() {
    return serverPublicKey !== null && clientKeyPair !== null
}

/**
 * Create encrypted axios instance
 */
const encryptedApi = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
})

/**
 * Request interceptor - encrypts outgoing requests
 */
encryptedApi.interceptors.request.use(async (config) => {
    // Skip encryption for key exchange endpoints
    if (config.url?.includes('/crypto/')) {
        return config
    }

    // Skip if no data to encrypt
    if (!config.data) {
        return config
    }

    // Ensure encryption is initialized
    if (!isEncryptionReady()) {
        await initializeEncryption()
    }

    try {
        // Encrypt the request body
        const encryptedPackage = await hybridEncrypt(config.data, serverPublicKey)

        // Replace data with encrypted package
        config.data = {
            encrypted: true,
            payload: encryptedPackage
        }

        // Add header to indicate encrypted request
        config.headers['X-Encrypted-Request'] = 'true'

    } catch (error) {
        console.error('Request encryption failed:', error)
        throw error
    }

    return config
}, (error) => {
    return Promise.reject(error)
})

/**
 * Response interceptor - decrypts incoming responses
 */
encryptedApi.interceptors.response.use(async (response) => {
    // Skip decryption for key exchange endpoints
    if (response.config.url?.includes('/crypto/')) {
        return response
    }

    // Check if response is encrypted
    if (response.data?.encrypted && response.data?.payload) {
        try {
            // Decrypt the response
            const decryptedData = await hybridDecrypt(
                response.data.payload,
                clientKeyPair.privateKey
            )

            // Parse JSON if applicable
            try {
                response.data = JSON.parse(decryptedData)
            } catch {
                response.data = decryptedData
            }
        } catch (error) {
            console.error('Response decryption failed:', error)
            throw error
        }
    }

    return response
}, (error) => {
    return Promise.reject(error)
})

// ============================================
// ENCRYPTED API ENDPOINTS
// ============================================

export const secureAuthApi = {
    register: (data) => encryptedApi.post('/auth/register', data),
    login: (data) => encryptedApi.post('/auth/login', data),
    logout: () => encryptedApi.post('/auth/logout'),
    getMe: () => encryptedApi.get('/auth/me'),
}

export const secureFileApi = {
    upload: (data) => encryptedApi.post('/files/upload', data),
    getAll: () => encryptedApi.get('/files'),
    getShared: () => encryptedApi.get('/files/shared'),
    getOne: (id) => encryptedApi.get(`/files/${id}`),
    download: (id) => encryptedApi.get(`/files/${id}/download`),
    update: (id, data) => encryptedApi.put(`/files/${id}`, data),
    delete: (id) => encryptedApi.delete(`/files/${id}`),
    restore: (id) => encryptedApi.post(`/files/${id}/restore`),
}

export const secureShareApi = {
    create: (data) => encryptedApi.post('/shares/create', data),
    getAll: () => encryptedApi.get('/shares'),
    getPublic: (token) => encryptedApi.get(`/shares/public/${token}`),
    accessPublic: (token, data) => encryptedApi.post(`/shares/public/${token}/access`, data),
    revoke: (id) => encryptedApi.delete(`/shares/${id}`),
}

export const secureNoteApi = {
    create: (data) => encryptedApi.post('/notes', data),
    access: (id) => encryptedApi.post(`/notes/${id}/access`),
}

export const secureDeviceApi = {
    getAll: () => encryptedApi.get('/devices'),
    revoke: (id) => encryptedApi.delete(`/devices/${id}`),
    revokeAllOthers: () => encryptedApi.delete('/devices/all-others'),
}

export const secureAnalyticsApi = {
    getStorage: () => encryptedApi.get('/analytics/storage'),
    getActivity: () => encryptedApi.get('/analytics/activity'),
    getFileStats: (id) => encryptedApi.get(`/analytics/file/${id}`),
}

export default encryptedApi
