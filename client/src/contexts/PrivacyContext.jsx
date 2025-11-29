import React, { createContext, useContext, useState } from 'react'

const PrivacyContext = createContext()

export const usePrivacy = () => {
    const context = useContext(PrivacyContext)
    if (!context) {
        throw new Error('usePrivacy must be used within PrivacyProvider')
    }
    return context
}

export const PrivacyProvider = ({ children }) => {
    const [privacyMode, setPrivacyMode] = useState(false)

    const togglePrivacyMode = () => {
        setPrivacyMode(prev => !prev)
    }

    return (
        <PrivacyContext.Provider value={{ privacyMode, togglePrivacyMode }}>
            {children}
        </PrivacyContext.Provider>
    )
}
