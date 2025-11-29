import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Eye, Trash2, FileText, User, Clock, Filter, Inbox, Search, Mail, CheckCircle2, FileImage, FileVideo, FileAudio, FileArchive, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { formatBytes, formatDate } from '@/lib/utils'
import { fileApi } from '@/services/api'
import { useToast } from '@/components/ui/Toast'

export const InboxPage = () => {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedTab, setSelectedTab] = useState('all')
    const [selectedFiles, setSelectedFiles] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const toast = useToast()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchSharedFiles = async () => {
            try {
                const { data } = await fileApi.getShared()
                // Handle backend response format
                setFiles(data?.files || data || [])
            } catch (error) {
                console.error('Failed to fetch inbox:', error)
                toast.error('Failed to load shared files')
            } finally {
                setLoading(false)
            }
        }
        fetchSharedFiles()
    }, [toast])

    const senders = [...new Set(files.map(f => f.owner?.email || f.sharedBy).filter(Boolean))]

    const filteredFiles = (selectedTab === 'all'
        ? files
        : files.filter(f => (f.owner?.email || f.sharedBy) === selectedTab)
    ).filter(f => {
        if (!searchQuery) return true
        const name = (f.name || f.originalName || '').toLowerCase()
        return name.includes(searchQuery.toLowerCase())
    })

    const handleSelectFile = (id) => {
        setSelectedFiles(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        if (selectedFiles.length === filteredFiles.length) {
            setSelectedFiles([])
        } else {
            setSelectedFiles(filteredFiles.map(f => f._id))
        }
    }

    const handleViewFile = (fileId) => {
        navigate(`/files/${fileId}`)
    }

    const handleDownloadFile = async (file) => {
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

    const handleDeleteExpired = () => {
        toast.info('Feature coming soon')
    }

    const getFileIcon = (file) => {
        const type = file.mimeType || ''
        if (type.startsWith('image/')) return FileImage
        if (type.startsWith('video/')) return FileVideo
        if (type.startsWith('audio/')) return FileAudio
        if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return FileArchive
        return FileText
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
                <p className="text-muted-foreground animate-pulse">Loading shared files...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="container mx-auto p-6 max-w-6xl space-y-6 relative">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Inbox</h1>
                                <p className="text-muted-foreground">Files shared with you</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-64"
                            />
                        </div>
                        <Button onClick={handleDeleteExpired} variant="outline" className="gap-2">
                            <Trash2 className="w-4 h-4" />
                            Delete Expired
                        </Button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Files', value: files.length, icon: Inbox, color: 'text-blue-500 bg-blue-500/10' },
                        { label: 'Senders', value: senders.length, icon: Users, color: 'text-purple-500 bg-purple-500/10' },
                        { label: 'Total Size', value: formatBytes(files.reduce((acc, f) => acc + (f.size || 0), 0)), icon: FileText, color: 'text-green-500 bg-green-500/10' },
                        { label: 'This Week', value: files.filter(f => new Date(f.sharedAt || f.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length, icon: Sparkles, color: 'text-orange-500 bg-orange-500/10' },
                    ].map((stat, idx) => (
                        <Card key={idx} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filter Tabs */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Filter className="w-5 h-5 text-primary" />
                            Filter by Sender
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={selectedTab === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedTab('all')}
                                className="gap-2"
                            >
                                <Inbox className="w-4 h-4" />
                                All Files
                                <Badge variant="secondary" className="ml-1">{files.length}</Badge>
                            </Button>
                            {senders.map(sender => (
                                <Button
                                    key={sender}
                                    variant={selectedTab === sender ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedTab(sender)}
                                    className="gap-2"
                                >
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                        {sender.charAt(0).toUpperCase()}
                                    </div>
                                    {sender.split('@')[0]}
                                    <Badge variant="secondary" className="ml-1">
                                        {files.filter(f => (f.owner?.email || f.sharedBy) === sender).length}
                                    </Badge>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Files List */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Received Files</CardTitle>
                                <CardDescription>
                                    {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} {searchQuery && 'matching your search'}
                                </CardDescription>
                            </div>
                            {filteredFiles.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={handleSelectAll} className="gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {selectedFiles.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {filteredFiles.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                    <Inbox className="w-10 h-10 text-muted-foreground/50" />
                                </div>
                                <p className="text-lg font-medium text-muted-foreground mb-2">No shared files found</p>
                                <p className="text-sm text-muted-foreground/70">
                                    {searchQuery ? 'Try a different search term' : 'Files shared with you will appear here'}
                                </p>
                            </div>
                        ) : (
                            filteredFiles.map(file => {
                                const FileIcon = getFileIcon(file)
                                const isSelected = selectedFiles.includes(file._id)
                                return (
                                    <div
                                        key={file._id}
                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${isSelected
                                                ? 'bg-primary/5 border-primary/30'
                                                : 'bg-card hover:bg-muted/30'
                                            }`}
                                    >
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectFile(file._id)}
                                                className="w-5 h-5 rounded-md border-2 accent-primary cursor-pointer"
                                            />
                                        </div>

                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary/20' : 'bg-primary/10'
                                            }`}>
                                            <FileIcon className="w-6 h-6 text-primary" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium truncate">{file.name || file.originalName}</p>
                                                {file.permissions === 'view' && (
                                                    <Badge variant="secondary" className="text-xs">View Only</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                                        {(file.owner?.fullName || file.owner?.email || file.sharedBy || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    {file.owner?.fullName || file.owner?.email || file.sharedBy || 'Unknown'}
                                                </div>
                                                <span className="text-muted-foreground/30">•</span>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDate(file.sharedAt || file.createdAt)}
                                                </div>
                                                <span className="text-muted-foreground/30">•</span>
                                                <span className="font-medium">{formatBytes(file.size)}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                                onClick={() => handleViewFile(file._id)}
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="gap-2 shadow-sm"
                                                onClick={() => handleDownloadFile(file)}
                                                disabled={file.permissions === 'view'}
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </CardContent>
                </Card>

                {/* Bulk Actions */}
                {selectedFiles.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                        <Card className="bg-card/95 backdrop-blur-lg border-primary/20 shadow-2xl">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">
                                                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                                            </p>
                                            <p className="text-xs text-muted-foreground">Ready for action</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedFiles([])}>
                                            Clear
                                        </Button>
                                        <Button size="sm" className="gap-2 shadow-lg">
                                            <Download className="w-4 h-4" />
                                            Download All
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
