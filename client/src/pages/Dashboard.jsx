import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Search, FileText, Image, Video, Music, Archive, MoreVertical, Share2, Download, Trash2, Clock, Shield, TrendingUp, HardDrive, AlertCircle, Eye, Sparkles, FolderOpen, Inbox, RefreshCw, Grid, List } from 'lucide-react'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatBytes, formatDate } from '@/lib/utils'
import { fileApi, analyticsApi, shareApi } from '@/services/api'
import { useToast } from '@/components/ui/Toast'

export const Dashboard = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [viewMode, setViewMode] = useState('grid')
    const [files, setFiles] = useState([])
    const [sharedLinksCount, setSharedLinksCount] = useState(0)
    const [inboxCount, setInboxCount] = useState(0)
    const [storageStats, setStorageStats] = useState({ used: 0, limit: 0 })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const { privacyMode } = usePrivacy()
    const toast = useToast()

    const fetchData = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true)
        try {
            const [filesRes, storageRes, sharesRes, inboxRes] = await Promise.all([
                fileApi.getAll(),
                analyticsApi.getStorage(),
                shareApi.getAll(),
                fileApi.getShared()
            ])
            setFiles(filesRes.data?.files || filesRes.data || [])
            setStorageStats(storageRes.data || { used: 0, limit: 10737418240 })
            setSharedLinksCount(sharesRes.data?.shareLinks?.length || 0)
            setInboxCount(inboxRes.data?.files?.length || 0)
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const categories = [
        { id: 'all', label: 'All Files', icon: FolderOpen, count: files.length, color: 'text-primary' },
        { id: 'document', label: 'Documents', icon: FileText, count: files.filter(f => f.category === 'document').length, color: 'text-blue-500' },
        { id: 'image', label: 'Images', icon: Image, count: files.filter(f => f.category === 'image').length, color: 'text-green-500' },
        { id: 'invoice', label: 'Invoices', icon: FileText, count: files.filter(f => f.category === 'invoice').length, color: 'text-orange-500' },
        { id: 'other', label: 'Others', icon: Archive, count: files.filter(f => f.category === 'other').length, color: 'text-purple-500' },
    ]

    const filteredFiles = files.filter(file => {
        const fileName = file.name || file.originalName || ''
        const matchesSearch = fileName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleDelete = async (id) => {
        try {
            await fileApi.delete(id)
            setFiles(files.filter(f => f._id !== id))
            toast.success('File moved to trash')
        } catch (error) {
            console.error(error)
            toast.error('Failed to delete file')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                        <Shield className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-muted-foreground animate-pulse">Loading your secure vault...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <div className="container mx-auto p-6 space-y-8">
                {/* Welcome Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome back! Here's an overview of your secure vault.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Security Tips Banner */}
                <Card className="bg-linear-to-r from-primary/10 via-primary/5 to-blue-500/10 border-primary/20 overflow-hidden relative shadow-md shadow-primary/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                    <CardContent className="p-5 flex items-center justify-between relative">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">Security Tip of the Day</p>
                                <p className="text-sm text-muted-foreground">
                                    Always enable password protection when sharing sensitive files externally
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0">
                            Learn More
                        </Button>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="group shadow-md shadow-black/5 hover:shadow-lg hover:shadow-black/10 transition-all duration-300 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Files</CardTitle>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="h-5 w-5 text-blue-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{files.length}</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-500" />
                                <span className="text-green-500 font-medium">
                                    {files.filter(f => new Date(f.createdAt).toDateString() === new Date().toDateString()).length}
                                </span>
                                uploaded today
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-md shadow-black/5 hover:shadow-lg hover:shadow-black/10 transition-all duration-300 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <HardDrive className="h-5 w-5 text-purple-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{formatBytes(storageStats.used)}</div>
                            <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
                                <div
                                    className="bg-linear-to-r from-purple-500 to-primary h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((storageStats.used / storageStats.limit) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {Math.round((storageStats.used / storageStats.limit) * 100)}% of {formatBytes(storageStats.limit)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-md shadow-black/5 hover:shadow-lg hover:shadow-black/10 transition-all duration-300 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Shared Links</CardTitle>
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Share2 className="h-5 w-5 text-green-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{sharedLinksCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Active share links</p>
                        </CardContent>
                    </Card>

                    <Link to="/inbox">
                        <Card className="group shadow-md shadow-black/5 hover:shadow-lg hover:shadow-black/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Inbox</CardTitle>
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                                    <Inbox className="h-5 w-5 text-orange-500" />
                                    {inboxCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
                                            {inboxCount}
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{inboxCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">Files shared with you</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Upload Area */}
                <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group shadow-md shadow-black/5">
                    <CardContent className="p-8">
                        <Link to="/upload">
                            <div className="flex flex-col items-center justify-center gap-4 cursor-pointer">
                                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Upload className="w-10 h-10 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-lg">Drag and drop files here</p>
                                    <p className="text-sm text-muted-foreground">or click to browse from your computer</p>
                                </div>
                                <Button className="gap-2 group-hover:gap-3 transition-all">
                                    <Upload className="w-4 h-4" />
                                    Upload Files
                                </Button>
                            </div>
                        </Link>
                    </CardContent>
                </Card>

                {/* File Categories and Files */}
                <Card className="overflow-hidden shadow-md shadow-black/5">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl">My Files</CardTitle>
                                <CardDescription>Manage your uploaded files securely</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="icon"
                                    onClick={() => setViewMode('grid')}
                                    className="h-9 w-9"
                                >
                                    <Grid className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="icon"
                                    onClick={() => setViewMode('list')}
                                    className="h-9 w-9"
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                                />
                            </div>
                        </div>

                        {/* Category Filters */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {categories.map(cat => (
                                <Button
                                    key={cat.id}
                                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`gap-2 transition-all ${selectedCategory === cat.id ? '' : 'hover:bg-muted'}`}
                                >
                                    <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? '' : cat.color}`} />
                                    {cat.label}
                                    <Badge
                                        variant={selectedCategory === cat.id ? 'secondary' : 'outline'}
                                        className="ml-1 text-xs"
                                    >
                                        {cat.count}
                                    </Badge>
                                </Button>
                            ))}
                        </div>

                        {/* Files Grid/List */}
                        {filteredFiles.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                    <FolderOpen className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <p className="text-lg font-medium mb-2">No files found</p>
                                <p className="text-muted-foreground mb-4">Upload some files to get started!</p>
                                <Link to="/upload">
                                    <Button className="gap-2">
                                        <Upload className="w-4 h-4" />
                                        Upload Files
                                    </Button>
                                </Link>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredFiles.map(file => (
                                    <FileCard
                                        key={file._id}
                                        file={file}
                                        privacyMode={privacyMode}
                                        onDelete={() => handleDelete(file._id)}
                                        toast={toast}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredFiles.map(file => (
                                    <FileListItem
                                        key={file._id}
                                        file={file}
                                        privacyMode={privacyMode}
                                        onDelete={() => handleDelete(file._id)}
                                        toast={toast}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

const FileCard = ({ file, privacyMode, onDelete, toast }) => {
    const fileName = file.name || file.originalName || 'Unnamed file'
    const fileType = file.mimeType || 'application/octet-stream'

    const getFileIcon = (type) => {
        if (type.includes('pdf')) return FileText
        if (type.includes('image')) return Image
        if (type.includes('video')) return Video
        if (type.includes('audio')) return Music
        if (type.includes('zip') || type.includes('rar')) return Archive
        return FileText
    }

    const getFileColor = (type) => {
        if (type.includes('pdf')) return 'text-red-500 bg-red-500/10'
        if (type.includes('image')) return 'text-green-500 bg-green-500/10'
        if (type.includes('video')) return 'text-purple-500 bg-purple-500/10'
        if (type.includes('audio')) return 'text-orange-500 bg-orange-500/10'
        return 'text-blue-500 bg-blue-500/10'
    }

    const handleDownload = async () => {
        try {
            const response = await fileApi.download(file._id)
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

    const Icon = getFileIcon(fileType)
    const colorClass = getFileColor(fileType)

    return (
        <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>

                <div className={privacyMode ? 'blur-sm hover:blur-none transition-all' : ''}>
                    <p className="font-medium text-sm truncate mb-1" title={fileName}>{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatBytes(file.size)} • {formatDate(file.createdAt)}
                    </p>
                </div>

                {file.isConfidential && (
                    <Badge variant="warning" className="mt-3 gap-1">
                        <Shield className="w-3 h-3" />
                        Confidential
                    </Badge>
                )}

                <div className="flex gap-1 mt-3 pt-3 border-t">
                    <Link to={`/files/${file._id}`} className="flex-1">
                        <Button variant="ghost" size="sm" className="w-full gap-1 h-8">
                            <Eye className="w-3 h-3" />
                            View
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
                        <Download className="w-3 h-3" />
                    </Button>
                    <Link to={`/share/${file._id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Share2 className="w-3 h-3" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

const FileListItem = ({ file, privacyMode, onDelete, toast }) => {
    const fileName = file.name || file.originalName || 'Unnamed file'
    const fileType = file.mimeType || 'application/octet-stream'

    const getFileIcon = (type) => {
        if (type.includes('pdf')) return FileText
        if (type.includes('image')) return Image
        if (type.includes('video')) return Video
        if (type.includes('audio')) return Music
        if (type.includes('zip') || type.includes('rar')) return Archive
        return FileText
    }

    const getFileColor = (type) => {
        if (type.includes('pdf')) return 'text-red-500 bg-red-500/10'
        if (type.includes('image')) return 'text-green-500 bg-green-500/10'
        if (type.includes('video')) return 'text-purple-500 bg-purple-500/10'
        if (type.includes('audio')) return 'text-orange-500 bg-orange-500/10'
        return 'text-blue-500 bg-blue-500/10'
    }

    const handleDownload = async () => {
        try {
            const response = await fileApi.download(file._id)
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

    const Icon = getFileIcon(fileType)
    const colorClass = getFileColor(fileType)

    return (
        <div className="group flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
            </div>

            <div className={`flex-1 min-w-0 ${privacyMode ? 'blur-sm group-hover:blur-none transition-all' : ''}`}>
                <p className="font-medium text-sm truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} • {formatDate(file.createdAt)}
                </p>
            </div>

            {file.isConfidential && (
                <Badge variant="warning" className="gap-1 shrink-0">
                    <Shield className="w-3 h-3" />
                    Confidential
                </Badge>
            )}

            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={`/files/${file._id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                    </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
                    <Download className="w-4 h-4" />
                </Button>
                <Link to={`/share/${file._id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Share2 className="w-4 h-4" />
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
