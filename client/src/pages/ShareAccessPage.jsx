import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, Lock, AlertCircle, FileIcon, Clock, Shield, Loader2, LogIn, FileText, Image, Video, Music, File, Eye, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { shareApi } from '@/services/api'

export const ShareAccessPage = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const toast = useToast()

    // Use sessionStorage key based on share token
    const sessionStorageKey = `share_session_${token}`

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [shareData, setShareData] = useState(null)
    const [passwordRequired, setPasswordRequired] = useState(false)
    const [password, setPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [requiresAuth, setRequiresAuth] = useState(false)
    const [accessDenied, setAccessDenied] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    // Initialize from sessionStorage (persists across refresh, cleared on tab/browser close)
    const [accessSessionToken, setAccessSessionToken] = useState(() => {
        return sessionStorage.getItem(sessionStorageKey)
    })

    const isLoggedIn = !!localStorage.getItem('token')

    const isPreviewable = (mimeType) => {
        if (!mimeType) return false
        return (
            mimeType.startsWith('image/') ||
            mimeType.startsWith('video/') ||
            mimeType.startsWith('audio/') ||
            mimeType === 'application/pdf' ||
            mimeType.startsWith('text/')
        )
    }

    const loadPreview = useCallback(async (pwd = null, sessionTkn = null) => {
        try {
            setPreviewLoading(true)
            const response = await shareApi.previewByToken(token, pwd, sessionTkn)
            const url = window.URL.createObjectURL(response.data)
            setPreviewUrl(url)
        } catch (err) {
            console.error('Failed to load preview:', err)
        } finally {
            setPreviewLoading(false)
        }
    }, [token])

    const [alreadyAccessed, setAlreadyAccessed] = useState(false)

    const fetchShareData = useCallback(async (pwd = null) => {
        try {
            setLoading(true)
            setError(null)
            setPasswordError('')

            const { data } = await shareApi.getByToken(token, pwd)

            if (data.success) {
                setShareData(data.shareLink)
                setPasswordRequired(false)

                // Store access session token for one-time links in sessionStorage
                // This persists across page refreshes but is cleared when tab/browser closes
                if (data.shareLink.accessSessionToken) {
                    setAccessSessionToken(data.shareLink.accessSessionToken)
                    sessionStorage.setItem(sessionStorageKey, data.shareLink.accessSessionToken)
                }

                // Auto-load preview for previewable files
                const file = data.shareLink.file
                const sessionTkn = data.shareLink.accessSessionToken || accessSessionToken
                if (isPreviewable(file.mimeType)) {
                    loadPreview(pwd, sessionTkn)
                }
            }
        } catch (err) {
            const response = err.response?.data

            if (response?.passwordRequired) {
                setPasswordRequired(true)
                if (pwd) {
                    setPasswordError('Invalid password')
                }
            } else if (response?.requiresAuth) {
                setRequiresAuth(true)
            } else if (response?.accessDenied) {
                setAccessDenied(true)
            } else if (response?.alreadyAccessed) {
                setAlreadyAccessed(true)
            } else {
                setError(response?.message || 'Failed to access share link')
            }
        } finally {
            setLoading(false)
        }
    }, [token, loadPreview, accessSessionToken, sessionStorageKey])

    useEffect(() => {
        fetchShareData()
    }, [fetchShareData])

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                window.URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    const [submittingPassword, setSubmittingPassword] = useState(false)

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        if (!password) {
            setPasswordError('Please enter a password')
            return
        }
        setSubmittingPassword(true)
        await fetchShareData(password)
        setSubmittingPassword(false)
    }

    const handleLogin = () => {
        localStorage.setItem('returnUrl', window.location.pathname)
        navigate('/login')
    }

    const handleDownload = async () => {
        if (!shareData) return

        try {
            setDownloading(true)
            const response = await shareApi.downloadByToken(token, password, accessSessionToken)

            const url = window.URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = url
            link.download = shareData.file.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success('File downloaded successfully!')

            // Update download count in UI
            if (shareData.maxDownloads) {
                setShareData(prev => ({
                    ...prev,
                    downloadCount: prev.downloadCount + 1,
                    downloadLimitReached: (prev.downloadCount + 1) >= prev.maxDownloads,
                    canDownload: (prev.downloadCount + 1) < prev.maxDownloads
                }))
            }
        } catch (err) {
            console.error('Download error:', err)
            const response = err.response?.data
            if (response?.downloadLimitReached) {
                // Update UI to show limit reached
                setShareData(prev => ({
                    ...prev,
                    downloadLimitReached: true,
                    canDownload: false
                }))
                toast.error('Download limit has been reached.')
            } else {
                toast.error(response?.message || 'Failed to download file')
            }
        } finally {
            setDownloading(false)
        }
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getFileIcon = (mimeType) => {
        if (mimeType?.startsWith('image/')) return <Image className="w-8 h-8" />
        if (mimeType?.startsWith('video/')) return <Video className="w-8 h-8" />
        if (mimeType?.startsWith('audio/')) return <Music className="w-8 h-8" />
        if (mimeType === 'application/pdf' || mimeType?.startsWith('text/')) return <FileText className="w-8 h-8" />
        return <File className="w-8 h-8" />
    }

    const getFileIconBackground = (mimeType) => {
        if (mimeType?.startsWith('image/')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
        if (mimeType?.startsWith('video/')) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
        if (mimeType?.startsWith('audio/')) return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600'
        if (mimeType === 'application/pdf') return 'bg-red-100 dark:bg-red-900/30 text-red-600'
        if (mimeType?.startsWith('text/')) return 'bg-green-100 dark:bg-green-900/30 text-green-600'
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600'
    }

    const renderPreview = () => {
        if (!shareData || !previewUrl) return null

        const { mimeType } = shareData.file

        if (mimeType?.startsWith('image/')) {
            return (
                <div className="w-full rounded-lg overflow-hidden border bg-muted/30">
                    <img
                        src={previewUrl}
                        alt={shareData.file.name}
                        className="w-full h-auto max-h-[500px] object-contain"
                    />
                </div>
            )
        }

        if (mimeType?.startsWith('video/')) {
            return (
                <div className="w-full rounded-lg overflow-hidden border bg-black">
                    <video
                        src={previewUrl}
                        controls
                        className="w-full max-h-[500px]"
                    >
                        Your browser does not support video playback.
                    </video>
                </div>
            )
        }

        if (mimeType?.startsWith('audio/')) {
            return (
                <div className="w-full p-4 rounded-lg border bg-muted/30">
                    <audio src={previewUrl} controls className="w-full">
                        Your browser does not support audio playback.
                    </audio>
                </div>
            )
        }

        if (mimeType === 'application/pdf') {
            return (
                <div className="w-full h-[500px] rounded-lg overflow-hidden border">
                    <iframe
                        src={previewUrl}
                        className="w-full h-full"
                        title={shareData.file.name}
                    />
                </div>
            )
        }

        if (mimeType?.startsWith('text/')) {
            return (
                <div className="w-full rounded-lg overflow-hidden border">
                    <iframe
                        src={previewUrl}
                        className="w-full h-[400px] bg-white dark:bg-gray-900"
                        title={shareData.file.name}
                    />
                </div>
            )
        }

        return null
    }

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                        <div className="relative w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                        <Shield className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                        <p className="text-lg font-medium">Accessing Secure File</p>
                        <p className="text-muted-foreground animate-pulse">Verifying permissions...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Requires Authentication (user not logged in for restricted link)
    if (requiresAuth) {
        return (
            <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
                <Card className="max-w-md w-full overflow-hidden">
                    <div className="h-2 bg-linear-to-r from-primary to-blue-500"></div>
                    <CardHeader className="text-center pt-8">
                        <div className="relative inline-block mx-auto mb-4">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                            <div className="relative w-20 h-20 bg-linear-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                <Shield className="w-10 h-10 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Authentication Required</CardTitle>
                        <CardDescription className="text-base">
                            This file is shared with specific users only. Please log in to access it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-8">
                        <Button onClick={handleLogin} className="w-full gap-2 h-12 text-base shadow-lg shadow-primary/25">
                            <LogIn className="w-5 h-5" />
                            Log In to Continue
                        </Button>
                        <p className="text-sm text-center text-muted-foreground">
                            You need to be logged in with an authorized account to access this file.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Access Denied (user logged in but doesn't have access)
    if (accessDenied) {
        return (
            <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
                <Card className="max-w-md w-full overflow-hidden">
                    <div className="h-2 bg-linear-to-r from-destructive to-red-400"></div>
                    <CardHeader className="text-center pt-8">
                        <div className="relative inline-block mx-auto mb-4">
                            <div className="absolute inset-0 bg-destructive/20 blur-xl rounded-full"></div>
                            <div className="relative w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20">
                                <XCircle className="w-10 h-10 text-destructive" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Access Restricted</CardTitle>
                        <CardDescription className="space-y-2 text-base">
                            <span className="block">This file is restricted to specific users only.</span>
                            <span className="block text-destructive font-medium">You do not have permission to view this file.</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-8">
                        <div className="bg-muted/50 rounded-xl p-4 text-sm text-center flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-muted-foreground shrink-0" />
                            <span>The file owner has not granted you access to this file.</span>
                        </div>
                        <Button variant="outline" onClick={() => navigate('/')} className="w-full h-12">
                            Go to Home
                        </Button>
                        {isLoggedIn && (
                            <p className="text-sm text-center text-muted-foreground">
                                If you believe you should have access, please contact the file owner.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Already Accessed (one-time access used)
    if (alreadyAccessed) {
        return (
            <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
                <Card className="max-w-md w-full overflow-hidden">
                    <div className="h-2 bg-linear-to-r from-amber-500 to-orange-500"></div>
                    <CardHeader className="text-center pt-8">
                        <div className="relative inline-block mx-auto mb-4">
                            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
                            <div className="relative w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                                <Eye className="w-10 h-10 text-amber-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Already Accessed</CardTitle>
                        <CardDescription className="space-y-2 text-base">
                            <span className="block">This file was shared with one-time access.</span>
                            <span className="block text-amber-600 font-medium">You have already viewed this file.</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-8">
                        <div className="bg-muted/50 rounded-xl p-4 text-sm text-center flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-muted-foreground shrink-0" />
                            <span>One-time access links can only be viewed once per user.</span>
                        </div>
                        <Button variant="outline" onClick={() => navigate('/')} className="w-full h-12">
                            Go to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
                <Card className="max-w-md w-full overflow-hidden">
                    <div className="h-2 bg-linear-to-r from-destructive to-red-400"></div>
                    <CardHeader className="text-center pt-8">
                        <div className="relative inline-block mx-auto mb-4">
                            <div className="absolute inset-0 bg-destructive/20 blur-xl rounded-full"></div>
                            <div className="relative w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20">
                                <AlertCircle className="w-10 h-10 text-destructive" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Unable to Access File</CardTitle>
                        <CardDescription className="text-base">{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        <Button variant="outline" onClick={() => navigate('/')} className="w-full h-12">
                            Go to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Password Required
    if (passwordRequired) {
        return (
            <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
                <Card className="max-w-md w-full overflow-hidden">
                    <div className="h-2 bg-linear-to-r from-primary to-blue-500"></div>
                    <CardHeader className="text-center pt-8">
                        <div className="relative inline-block mx-auto mb-4">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                            <div className="relative w-20 h-20 bg-linear-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                <Lock className="w-10 h-10 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Password Protected</CardTitle>
                        <CardDescription className="text-base">
                            This file is protected with a password. Enter the password to access it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`h-12 text-center text-lg ${passwordError ? 'border-destructive focus:ring-destructive' : ''}`}
                                />
                                {passwordError && (
                                    <p className="text-sm text-destructive text-center flex items-center justify-center gap-2">
                                        <XCircle className="w-4 h-4" />
                                        {passwordError}
                                    </p>
                                )}
                            </div>
                            <Button type="submit" className="w-full gap-2 h-12 text-base shadow-lg shadow-primary/25" disabled={submittingPassword}>
                                {submittingPassword ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-5 h-5" />
                                        Unlock & Access File
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // File Access View with Preview
    if (shareData) {
        const file = shareData.file
        const canDownload = shareData.permissions === 'download'
        const hasPreview = isPreviewable(file.mimeType)

        return (
            <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 py-8 px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* File Header Card */}
                    <Card className="overflow-hidden">
                        <div className="h-1.5 bg-linear-to-r from-primary via-blue-500 to-purple-500"></div>
                        <CardHeader className="bg-linear-to-r from-muted/50 to-transparent">
                            <div className="flex items-start gap-4">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 ${getFileIconBackground(file.mimeType)} shadow-lg`}>
                                    {getFileIcon(file.mimeType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="break-all text-2xl mb-1">{file.name}</CardTitle>
                                    <CardDescription className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                                        <Badge variant="outline">{file.mimeType}</Badge>
                                    </CardDescription>
                                    {shareData.message && (
                                        <div className="mt-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                                            <p className="text-sm italic text-muted-foreground">
                                                "{shareData.message}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {/* File Info */}
                            <div className="bg-muted/30 rounded-xl p-5 grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Access Type
                                    </span>
                                    <span className="font-semibold">
                                        {shareData.accessMode === 'public' ? 'Public' : 'Restricted'}
                                    </span>
                                </div>
                                {shareData.expiresAt && (
                                    <div className="space-y-1">
                                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Expires
                                        </span>
                                        <span className="font-semibold">
                                            {new Date(shareData.expiresAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {shareData.maxDownloads && (
                                    <div className="space-y-1">
                                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Download className="w-4 h-4" />
                                            Downloads
                                        </span>
                                        <span className={`font-semibold ${shareData.downloadLimitReached ? 'text-destructive' : ''}`}>
                                            {shareData.downloadCount} / {shareData.maxDownloads}
                                            {shareData.downloadLimitReached && ' (Limit reached)'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Download Button or Limit Reached Message */}
                            {canDownload && (
                                shareData.downloadLimitReached ? (
                                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                                        <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="w-8 h-8 text-destructive" />
                                        </div>
                                        <p className="font-semibold text-lg text-destructive mb-1">Download Limit Reached</p>
                                        <p className="text-sm text-muted-foreground">
                                            {shareData.accessMode === 'restricted'
                                                ? 'You have used all your allowed downloads for this file.'
                                                : 'This link has reached its maximum download limit.'}
                                        </p>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        className="w-full gap-3 h-14 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                                    >
                                        {downloading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                Download File
                                                {shareData.maxDownloads && (
                                                    <Badge variant="secondary" className="ml-2">
                                                        {shareData.maxDownloads - shareData.downloadCount} remaining
                                                    </Badge>
                                                )}
                                            </>
                                        )}
                                    </Button>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* File Preview Card */}
                    {hasPreview && (
                        <Card className="overflow-hidden">
                            <CardHeader className="bg-linear-to-r from-muted/50 to-transparent border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-primary" />
                                    File Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {previewLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        </div>
                                        <p className="text-muted-foreground mt-4">Loading preview...</p>
                                    </div>
                                ) : previewUrl ? (
                                    renderPreview()
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <FileIcon className="w-10 h-10 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-muted-foreground">Preview not available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        )
    }

    return null
}
