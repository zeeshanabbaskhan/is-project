/**
 * Encryption Context
 * Manages RSA+AES encryption state for secure communication over HTTP
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { initializeEncryption, isEncryptionReady } from '../services/encryptedApi'

const EncryptionContext = createContext()

export const useEncryption = () => {
    const context = useContext(EncryptionContext)
    if (!context) {
        throw new Error('useEncryption must be used within EncryptionProvider')
    }
    return context
}

export const EncryptionProvider = ({ children }) => {
    const [isReady, setIsReady] = useState(false)
    const [isInitializing, setIsInitializing] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const init = async () => {
            try {
                setIsInitializing(true)
                setError(null)

                const success = await initializeEncryption()

                if (success) {
                    setIsReady(true)
                    console.log('🔐 Encryption initialized successfully')
                } else {
                    setError('Failed to initialize encryption')
                    console.warn('⚠️ Encryption initialization failed - falling back to unencrypted')
                }
            } catch (err) {
                console.error('Encryption initialization error:', err)
                setError(err.message)
            } finally {
                setIsInitializing(false)
            }
        }

        init()
    }, [])

    /**
     * Retry encryption initialization
     */
    const retryInitialization = async () => {
        setIsInitializing(true)
        setError(null)

        try {
            const success = await initializeEncryption()
            setIsReady(success)
            if (!success) {
                setError('Failed to initialize encryption')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setIsInitializing(false)
        }
    }

    /**
     * Check current encryption status
     */
    const checkStatus = () => {
        return isEncryptionReady()
    }

    return (
        <EncryptionContext.Provider value={{
            isReady,
            isInitializing,
            error,
            retryInitialization,
            checkStatus
        }}>
            {children}
        </EncryptionContext.Provider>
    )
}
