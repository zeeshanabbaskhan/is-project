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
            try {
                const { data } = await authApi.getMe()
                setUser(data)
            } catch (error) {
                console.error(error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        checkAuth()
    }, [])

    const login = async (credentials) => {
        const { data } = await authApi.login(credentials)
        setUser(data.user)
        return data
    }

    const signup = async (userData) => {
        const { data } = await authApi.register(userData)
        setUser(data.user)
        return data
    }

    const logout = async () => {
        try {
            await authApi.logout()
        } finally {
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            signup,
            isAuthenticated: !!user,
            loading
        }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
