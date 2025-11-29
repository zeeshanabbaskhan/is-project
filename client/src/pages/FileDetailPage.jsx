import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FileText, Download, Share2, Trash2, Eye, EyeOff, Shield, User, Mail, Link2, Image, Video, Music, File as FileIcon, Activity, X, ArrowLeft, Clock, HardDrive, FolderOpen, Sparkles, Lock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatBytes, formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { fileApi, shareApi } from '@/services/api'

export const FileDetailPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [isOwner, setIsOwner] = useState(false)
    const [shareLinks, setShareLinks] = useState([])
    const [loading, setLoading] = useState(true)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const toast = useToast()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await fileApi.getOne(id)
                setFile(data?.file || data)
                setIsOwner(data?.isOwner || false)
                setShareLinks(data?.shareLinks || [])
            } catch (error) {
                console.error('Failed to fetch file details:', error)
                toast.error('Failed to load file details')
                navigate('/dashboard')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id, navigate, toast])

    // Load preview when user clicks to view
    const loadPreview = async () => {
        if (previewUrl) {
            setShowPreview(true)
            return
        }

        setPreviewLoading(true)
        try {
            const response = await fileApi.preview(id)
            const blob = new Blob([response.data], { type: file.mimeType })
            const url = window.URL.createObjectURL(blob)
            setPreviewUrl(url)
            setShowPreview(true)
        } catch (error) {
            console.error('Preview failed:', error)
            toast.error('Failed to load preview')
        } finally {
            setPreviewLoading(false)
        }
    }

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                window.URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    const handleDownload = async () => {
        try {
            const response = await fileApi.download(id)
            const blob = new Blob([response.data], { type: file.mimeType })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name || file.originalName || 'download'
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success('File downloaded successfully')
        } catch (error) {
            console.error('Download failed:', error)
            toast.error('Failed to download file')
        }
    }

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this file?')) {
            try {
                await fileApi.delete(id)
                toast.success('File deleted')
                navigate('/dashboard')
            } catch (error) {
                console.error('Delete failed:', error)
                toast.error('Failed to delete file')
            }
        }
    }

    // Check if file type is previewable
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

    // Render the preview based on file type
    const renderPreview = () => {
        if (!previewUrl || !showPreview) return null

        const mimeType = file.mimeType || ''

        if (mimeType.startsWith('image/')) {
            return (
                <img
                    src={previewUrl}
                    alt={file.name}
                    className="max-w-full max-h-[500px] object-contain mx-auto rounded-lg"
                />
            )
        }

        if (mimeType.startsWith('video/')) {
            return (
                <video
                    src={previewUrl}
                    controls
                    className="max-w-full max-h-[500px] mx-auto rounded-lg"
                >
                    Your browser does not support video playback.
                </video>
            )
        }

        if (mimeType.startsWith('audio/')) {
            return (
                <div className="flex flex-col items-center gap-4 py-8">
                    <Music className="w-24 h-24 text-primary" />
                    <audio src={previewUrl} controls className="w-full max-w-md">
                        Your browser does not support audio playback.
                    </audio>
                </div>
            )
        }

        if (mimeType === 'application/pdf') {
            return (
                <iframe
                    src={previewUrl}
                    className="w-full h-[600px] rounded-lg border"
                    title="PDF Preview"
                />
            )
        }

        if (mimeType.startsWith('text/')) {
            return (
                <iframe
                    src={previewUrl}
                    className="w-full h-[400px] rounded-lg border bg-white"
                    title="Text Preview"
                />
            )
        }

        return (
            <div className="text-center py-8 text-muted-foreground">
                <FileIcon className="w-24 h-24 mx-auto mb-4" />
                <p>Preview not available for this file type</p>
            </div>
        )
    }

    // Get file icon based on type
    const getFileIcon = () => {
        const mimeType = file?.mimeType || ''
        if (mimeType.startsWith('image/')) return Image
        if (mimeType.startsWith('video/')) return Video
        if (mimeType.startsWith('audio/')) return Music
        return FileText
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
                <p className="text-muted-foreground animate-pulse">Loading file details...</p>
            </div>
        )
    }

    if (!file) return null

    const fileName = file.name || file.originalName || 'Unknown file'
    const FileIconComponent = getFileIcon()

    return (
        <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="container mx-auto p-6 max-w-6xl space-y-6 relative">
                {/* Back button */}
                <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Button>

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                            <FileIconComponent className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold mb-2">{fileName}</h1>
                            <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1.5">
                                    <HardDrive className="w-4 h-4" />
                                    {formatBytes(file.size)}
                                </span>
                                <span className="text-muted-foreground/30">•</span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    {isOwner ? 'Uploaded' : 'Shared'} {formatDate(file.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" className="gap-2 shadow-sm" onClick={handleDownload}>
                            <Download className="w-4 h-4" />
                            Download
                        </Button>
                        {isOwner && (
                            <>
                                <Button variant="outline" className="gap-2 shadow-sm" onClick={() => navigate(`/share/${id}`)}>
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </Button>
                                <Button variant="destructive" className="gap-2 shadow-sm" onClick={handleDelete}>
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Security Badges */}
                <div className="flex gap-2 flex-wrap">
                    <Badge className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/30 px-3 py-1">
                        <Lock className="w-3.5 h-3.5" />
                        AES-256-GCM Encrypted
                    </Badge>
                    <Badge variant="secondary" className="px-3 py-1">{file.mimeType}</Badge>
                    {file.isConfidential && (
                        <Badge className="gap-1.5 bg-orange-500/10 text-orange-600 border-orange-500/30 px-3 py-1">
                            <Shield className="w-3.5 h-3.5" />
                            Confidential
                        </Badge>
                    )}
                    {!isOwner && (
                        <Badge className="gap-1.5 bg-blue-500/10 text-blue-600 border-blue-500/30 px-3 py-1">
                            <User className="w-3.5 h-3.5" />
                            Shared by {file.owner?.name || file.owner?.email || 'Unknown'}
                        </Badge>
                    )}
                </div>

                {/* File Preview Section */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Eye className="w-4 h-4 text-primary" />
                                </div>
                                File Preview
                            </CardTitle>
                            {isPreviewable(file.mimeType) && !showPreview && (
                                <Button onClick={loadPreview} disabled={previewLoading} className="gap-2 shadow-sm">
                                    {previewLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-4 h-4" />
                                            View File
                                        </>
                                    )}
                                </Button>
                            )}
                            {showPreview && (
                                <Button variant="outline" onClick={() => setShowPreview(false)} className="gap-2">
                                    <EyeOff className="w-4 h-4" />
                                    Hide Preview
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {showPreview && previewUrl ? (
                            <div className="bg-muted/30 rounded-xl p-6">
                                {renderPreview()}
                            </div>
                        ) : (
                            <div className="bg-muted/30 rounded-xl p-12 text-center">
                                <div className="w-24 h-24 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                    <FileIconComponent className="w-12 h-12 text-muted-foreground" />
                                </div>
                                <p className="text-lg font-medium">{fileName}</p>
                                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                                    {isPreviewable(file.mimeType)
                                        ? 'Click "View File" to see the content'
                                        : 'Preview not available for this file type. Click Download to view.'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* File Metadata */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                            </div>
                            File Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: 'File Name', value: fileName, icon: FileText },
                                { label: 'File Size', value: formatBytes(file.size), icon: HardDrive },
                                { label: 'Type', value: file.mimeType, icon: FileIcon },
                                { label: 'Category', value: file.category || 'Other', icon: FolderOpen },
                                { label: isOwner ? 'Uploaded' : 'Shared', value: formatDate(file.createdAt), icon: Clock },
                                { label: 'Downloads', value: file.downloadCount || 0, icon: Download },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <item.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{item.label}</p>
                                        <p className="font-medium capitalize truncate">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Owner-only: People shared with (via email) */}
                {isOwner && file.sharedWith && file.sharedWith.length > 0 && (
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-purple-500" />
                                </div>
                                Shared with People
                                <Badge variant="secondary">{file.sharedWith.length}</Badge>
                            </CardTitle>
                            <CardDescription>People who have direct access to this file</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                {file.sharedWith.map((share, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <User className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {share.user?.name || share.user?.email || 'Unknown User'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {share.user?.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <Badge className={share.permissions === 'download' ? 'bg-green-500/10 text-green-600 border-green-500/30' : ''}>
                                                    {share.permissions || 'view'}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Shared {formatDate(share.sharedAt)}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={async () => {
                                                    if (confirm(`Remove ${share.user?.email || 'this user'} from shared access?`)) {
                                                        try {
                                                            await fileApi.removeSharedUser(id, share.user?._id)
                                                            toast.success('User removed from shared access')
                                                            // Refresh file data
                                                            const { data } = await fileApi.getOne(id)
                                                            setFile(data?.file || data)
                                                        } catch (error) {
                                                            console.error('Failed to remove shared user:', error)
                                                            toast.error('Failed to remove user')
                                                        }
                                                    }
                                                }}
                                                title="Remove access"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Owner-only: Share Links */}
                {isOwner && shareLinks.length > 0 && (
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Link2 className="w-4 h-4 text-blue-500" />
                                </div>
                                Share Links
                                <Badge variant="secondary">{shareLinks.length}</Badge>
                            </CardTitle>
                            <CardDescription>Public links created for this file</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                {shareLinks.map((link) => (
                                    <div key={link._id || link.token} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                <Link2 className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium font-mono text-sm">
                                                    ...{link.token?.slice(-8) || 'N/A'}
                                                </p>
                                                {link.recipientEmail && (
                                                    <p className="text-sm text-muted-foreground">
                                                        For: {link.recipientEmail}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Badge className={link.isActive ? 'bg-green-500/10 text-green-600 border-green-500/30' : ''}>
                                                        {link.isActive ? (
                                                            <><CheckCircle className="w-3 h-3 mr-1" />Active</>
                                                        ) : 'Inactive'}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {link.downloadCount || 0} downloads
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Created {formatDate(link.createdAt)}
                                                    {link.expiresAt && ` • Expires ${formatDate(link.expiresAt)}`}
                                                </p>
                                            </div>
                                            <Link
                                                to={`/share-link/${link._id}/trace`}
                                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View access trace"
                                            >
                                                <Activity className="w-4 h-4" />
                                                Trace
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={async () => {
                                                    if (confirm('Are you sure you want to delete this share link?')) {
                                                        try {
                                                            await shareApi.delete(link._id)
                                                            toast.success('Share link deleted')
                                                            // Refresh file data
                                                            const { data } = await fileApi.getOne(id)
                                                            setShareLinks(data?.shareLinks || [])
                                                        } catch (error) {
                                                            console.error('Failed to delete share link:', error)
                                                            toast.error('Failed to delete share link')
                                                        }
                                                    }
                                                }}
                                                title="Delete share link"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* If no sharing info and owner */}
                {isOwner && (!file.sharedWith || file.sharedWith.length === 0) && shareLinks.length === 0 && (
                    <Card className="border-dashed border-2 overflow-hidden">
                        <CardContent className="p-12 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                <Share2 className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">File Not Shared Yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Share this file with others by creating a secure link or sending directly via email
                            </p>
                            <Button onClick={() => navigate(`/share/${id}`)} className="gap-2 shadow-lg">
                                <Share2 className="w-4 h-4" />
                                Share File
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
