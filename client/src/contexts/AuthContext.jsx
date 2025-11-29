import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                setLoading(false)
                return
            }

            try {
                const { data } = await authApi.getMe()
                if (data.success && data.user) {
                    setUser(data.user)
                } else {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                }
            } catch (error) {
                console.error('Auth check failed:', error)
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        checkAuth()
    }, [])

    const login = async (credentials) => {
        const { data } = await authApi.login(credentials)

        // If 2FA is required, return without setting user
        if (data.requiresTwoFactor) {
            return data
        }

        if (data.success && data.token) {
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            setUser(data.user)
        }
        return data
    }

    const signup = async (userData) => {
        const { data } = await authApi.register(userData)
        if (data.success && data.token) {
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            setUser(data.user)
        }
        return data
    }

    const logout = async () => {
        try {
            await authApi.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setUser(null)
        }
    }

    const updateUser = (updates) => {
        const updatedUser = { ...user, ...updates }
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
    }

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            signup,
            updateUser,
            isAuthenticated: !!user,
            loading
        }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
