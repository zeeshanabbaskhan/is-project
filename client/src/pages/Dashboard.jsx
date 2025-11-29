import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Search, FileText, Image, Video, Music, Archive, MoreVertical, Share2, Download, Trash2, Clock, Shield, TrendingUp, HardDrive, AlertCircle, Eye } from 'lucide-react'
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
    const [files, setFiles] = useState([])
    const [sharedLinksCount, setSharedLinksCount] = useState(0)
    const [inboxCount, setInboxCount] = useState(0)
    const [storageStats, setStorageStats] = useState({ used: 0, limit: 0 })
    const [loading, setLoading] = useState(true)
    const { privacyMode } = usePrivacy()
    const toast = useToast()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [filesRes, storageRes, sharesRes, inboxRes] = await Promise.all([
                    fileApi.getAll(),
                    analyticsApi.getStorage(),
                    shareApi.getAll(),
                    fileApi.getShared()
                ])
                setFiles(filesRes.data)
                setStorageStats(storageRes.data)
                setSharedLinksCount(sharesRes.data.length)
                setInboxCount(inboxRes.data.length)
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
                toast.error('Failed to load dashboard data')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [toast])

    const categories = [
        { id: 'all', label: 'All Files', icon: FileText, count: files.length },
        { id: 'document', label: 'Documents', icon: FileText, count: files.filter(f => f.category === 'document').length },
        { id: 'image', label: 'Images', icon: Image, count: files.filter(f => f.category === 'image').length },
        { id: 'invoice', label: 'Invoices', icon: FileText, count: files.filter(f => f.category === 'invoice').length },
        { id: 'other', label: 'Others', icon: Shield, count: files.filter(f => f.category === 'other').length },
    ]

    const filteredFiles = files.filter(file => {
        const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
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
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 space-y-6">
                {/* Security Tips Banner */}
                <Card className="bg-linear-to-r from-primary/10 to-blue-500/10 border-primary/20">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-primary" />
                            <div>
                                <p className="font-semibold">Security Tip</p>
                                <p className="text-sm text-muted-foreground">
                                    Always enable password protection when sharing sensitive files
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">Learn More</Button>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{files.length}</div>
                            <p className="text-xs text-muted-foreground">
                                <TrendingUp className="inline w-3 h-3 mr-1" />
                                {files.filter(f => new Date(f.createdAt).toDateString() === new Date().toDateString()).length} uploaded today
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatBytes(storageStats.used)}</div>
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                                <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${Math.min((storageStats.used / storageStats.limit) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {Math.round((storageStats.used / storageStats.limit) * 100)}% of {formatBytes(storageStats.limit)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Shared Links</CardTitle>
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{sharedLinksCount}</div>
                            <p className="text-xs text-muted-foreground">Active links</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inbox</CardTitle>
                            <AlertCircle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inboxCount}</div>
                            <p className="text-xs text-muted-foreground">
                                Files shared with you
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Drag and Drop Upload Area */}
                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="p-8">
                        <Link to="/upload">
                            <div className="flex flex-col items-center justify-center gap-4 cursor-pointer">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold">Drag and drop files here</p>
                                    <p className="text-sm text-muted-foreground">or click to browse</p>
                                </div>
                                <Button>Upload Files</Button>
                            </div>
                        </Link>
                    </CardContent>
                </Card>

                {/* File Categories and Files */}
                <Card>
                    <CardHeader>
                        <CardTitle>My Files</CardTitle>
                        <CardDescription>Manage your uploaded files</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
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
                                    className="gap-2"
                                >
                                    <cat.icon className="w-4 h-4" />
                                    {cat.label}
                                    <Badge variant="secondary" className="ml-1">{cat.count}</Badge>
                                </Button>
                            ))}
                        </div>

                        {/* Files Grid */}
                        {filteredFiles.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No files found. Upload some files to get started!
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredFiles.map(file => (
                                    <FileCard
                                        key={file._id}
                                        file={file}
                                        privacyMode={privacyMode}
                                        onDelete={() => handleDelete(file._id)}
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

const FileCard = ({ file, privacyMode, onDelete }) => {
    const getFileIcon = (type) => {
        if (type.includes('pdf')) return FileText
        if (type.includes('image')) return Image
        if (type.includes('video')) return Video
        if (type.includes('audio')) return Music
        if (type.includes('zip') || type.includes('rar')) return Archive
        return FileText
    }

    const Icon = getFileIcon(file.mimeType)

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {/* Render Icon as a component instance, not a component definition */}
                        {React.createElement(Icon, { className: "w-8 h-8 text-primary" })}
                        <div className={privacyMode ? 'privacy-screen' : ''}>
                            <p className="font-medium text-sm truncate max-w-[150px]" title={file.originalName}>{file.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatBytes(file.size)} • {formatDate(file.createdAt)}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>

                {file.isConfidential && (
                    <Badge variant="warning" className="mb-3 gap-1">
                        <Shield className="w-3 h-3" />
                        Confidential
                    </Badge>
                )}

                <div className="flex gap-1 mb-3 flex-wrap">
                    {file.tags && file.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex gap-2">
                    <Link to={`/files/${file._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                            <Eye className="w-3 h-3" />
                            View
                        </Button>
                    </Link>
                    <Link to={`/share/${file._id}`}>
                        <Button variant="ghost" size="sm">
                            <Share2 className="w-3 h-3" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                        <Download className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
