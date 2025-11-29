import React, { useState, useEffect } from 'react'
import { Download, Eye, Trash2, FileText, User, Clock, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatBytes, formatDate } from '@/lib/utils'
import { fileApi } from '@/services/api'
import { useToast } from '@/components/ui/Toast'

export const InboxPage = () => {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedTab, setSelectedTab] = useState('all')
    const [selectedFiles, setSelectedFiles] = useState([])
    const toast = useToast()

    useEffect(() => {
        const fetchSharedFiles = async () => {
            try {
                const { data } = await fileApi.getShared()
                setFiles(data)
            } catch (error) {
                console.error('Failed to fetch inbox:', error)
                toast.error('Failed to load shared files')
            } finally {
                setLoading(false)
            }
        }
        fetchSharedFiles()
    }, [toast])

    const senders = [...new Set(files.map(f => f.owner?.email).filter(Boolean))]

    const filteredFiles = selectedTab === 'all'
        ? files
        : files.filter(f => f.owner?.email === selectedTab)

    const handleSelectFile = (id) => {
        setSelectedFiles(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        )
    }

    const handleDeleteExpired = () => {
        toast.info('Feature coming soon')
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Inbox</h1>
                        <p className="text-muted-foreground">
                            Files shared with you
                        </p>
                    </div>
                    <Button onClick={handleDeleteExpired} variant="outline" className="gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Expired
                    </Button>
                </div>

                {/* Filter Tabs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Filter by Sender
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={selectedTab === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedTab('all')}
                            >
                                All Files
                                <Badge variant="secondary" className="ml-2">{files.length}</Badge>
                            </Button>
                            {senders.map(sender => (
                                <Button
                                    key={sender}
                                    variant={selectedTab === sender ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedTab(sender)}
                                    className="gap-2"
                                >
                                    <User className="w-3 h-3" />
                                    {sender.split('@')[0]}
                                    <Badge variant="secondary" className="ml-1">
                                        {files.filter(f => f.owner?.email === sender).length}
                                    </Badge>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Files List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Received Files</CardTitle>
                        <CardDescription>
                            {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {filteredFiles.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No shared files found</div>
                        ) : (
                            filteredFiles.map(file => (
                                <div
                                    key={file._id}
                                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.includes(file._id)}
                                        onChange={() => handleSelectFile(file._id)}
                                        className="w-4 h-4"
                                    />

                                    <FileText className="w-10 h-10 text-primary shrink-0" />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium truncate">{file.originalName}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {file.owner?.fullName || file.owner?.email || 'Unknown'}
                                            </div>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(file.createdAt)}
                                            </div>
                                            <span>•</span>
                                            <span>{formatBytes(file.size)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Eye className="w-4 h-4" />
                                            View
                                        </Button>
                                        <Button size="sm" className="gap-2">
                                            <Download className="w-4 h-4" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Bulk Actions */}
                {selectedFiles.length > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <p className="font-medium">
                                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Download className="w-4 h-4" />
                                        Download All
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
