import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export function generateShareLink(fileId) {
    return `${window.location.origin}/share/${fileId}`
}

export function calculatePasswordStrength(password) {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++

    return {
        score: strength,
        label: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength] || 'Very Weak'
    }
}

export function detectSensitiveContent(text) {
    const patterns = [
        /\b\d{3}-\d{2}-\d{4}\b/, // SSN
        /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit Card
        /passport/i,
        /confidential/i,
        /tax\s+id/i
    ]

    return patterns.some(pattern => pattern.test(text))
}

export async function hashFile(file) {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
}

export function categorizefile(filename) {
    const ext = filename.split('.').pop()?.toLowerCase()

    const categories = {
        invoice: ['invoice', 'receipt', 'bill'],
        passport: ['passport', 'id'],
        tax: ['tax', 'w2', '1099'],
        legal: ['contract', 'agreement', 'legal'],
        confidential: ['confidential', 'private', 'secret']
    }

    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => filename.toLowerCase().includes(keyword))) {
            return category
        }
    }

    const typeMap = {
        pdf: 'document',
        doc: 'document',
        docx: 'document',
        jpg: 'image',
        jpeg: 'image',
        png: 'image',
        mp4: 'video',
        mp3: 'audio'
    }

    return typeMap[ext] || 'other'
}
