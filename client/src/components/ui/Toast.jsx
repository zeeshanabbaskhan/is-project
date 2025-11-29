import React, { createContext, useContext, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastContext = createContext()

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([])

    const addToast = (toast) => {
        setToasts((prev) => {
            const id = Date.now()
            const newToast = { ...toast, id }
            setTimeout(() => removeToast(id), toast.duration || 5000)
            return [...prev, newToast]
        })
    }

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }

    const toast = {
        success: (message) => addToast({ type: 'success', message }),
        error: (message) => addToast({ type: 'error', message }),
        warning: (message) => addToast({ type: 'warning', message }),
        info: (message) => addToast({ type: 'info', message }),
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

const Toast = ({ type, message, onClose }) => {
    const variants = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-white',
        info: 'bg-blue-500 text-white',
    }

    // Ensure message is a string (handle objects/errors gracefully)
    const displayMessage = typeof message === 'string'
        ? message
        : message?.message || JSON.stringify(message) || 'An error occurred'

    return (
        <div className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-md shadow-lg min-w-[300px]',
            variants[type]
        )}>
            <p className="flex-1 text-sm font-medium">{displayMessage}</p>
            <button onClick={onClose} className="hover:opacity-80">
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
