import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload as UploadIcon, FileText, X, Shield, AlertTriangle, CheckCircle, Hash } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatBytes, detectSensitiveContent, categorizefile } from '@/lib/utils'
import { fileApi } from '@/services/api'

export const UploadPage = () => {
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [encryptionEnabled, setEncryptionEnabled] = useState(true)
    const toast = useToast()
    const navigate = useNavigate()

    const processFiles = useCallback(async (newFiles) => {
        const processedFiles = await Promise.all(
            newFiles.map(async (file) => {
                const category = categorizefile(file.name)
                const isSensitive = detectSensitiveContent(file.name)

                return {
                    id: Date.now() + Math.random(),
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    category,
                    isSensitive,
                    progress: 0,
                    status: 'pending',
                    hash: null
                }
            })
        )

        setFiles(prev => [...prev, ...processedFiles])

        // Show warning for sensitive content
        const sensitiveFiles = processedFiles.filter(f => f.isSensitive)
        if (sensitiveFiles.length > 0) {
            toast.warning(`${sensitiveFiles.length} file(s) contain potentially sensitive content`)
        }

        // Check for duplicates (simplified)
        const fileNames = files.map(f => f.name)
        const duplicates = processedFiles.filter(f => fileNames.includes(f.name))
        if (duplicates.length > 0) {
            toast.warning(`${duplicates.length} duplicate file(s) detected`)
        }
    }, [files, toast])

    const onDrop = useCallback((e) => {
        e.preventDefault()
        const droppedFiles = Array.from(e.dataTransfer.files)
        processFiles(droppedFiles)
    }, [processFiles])

    const onDragOver = (e) => {
        e.preventDefault()
    }

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files)
        processFiles(selectedFiles)
    }

    const removeFile = (id) => {
        setFiles(files.filter(f => f.id !== id))
    }

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.error('Please select files to upload')
            return
        }

        if (!encryptionEnabled) {
            toast.warning('Uploading without encryption is not recommended')
        }

        setUploading(true)

        try {
            for (let i = 0; i < files.length; i++) {
                const fileItem = files[i]

                // Simulate hashing
                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id ? { ...f, status: 'hashing' } : f
                ))
                await new Promise(resolve => setTimeout(resolve, 300))

                // Simulate encryption
                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id ? { ...f, status: 'encrypting' } : f
                ))
                await new Promise(resolve => setTimeout(resolve, 300))

                // Upload
                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id ? { ...f, status: 'uploading' } : f
                ))

                // In a real app, we would encrypt the file content here
                // For now, we just send metadata to our backend
                await fileApi.upload({
                    originalName: fileItem.name,
                    mimeType: fileItem.type || 'application/octet-stream',
                    size: fileItem.size,
                    category: fileItem.category,
                    encryption: {
                        algorithm: encryptionEnabled ? 'AES-256-GCM' : 'None',
                        iv: 'mock-iv', // In real app, generate random IV
                        authTag: 'mock-tag'
                    },
                    storageKey: `mock-s3-key-${Date.now()}` // In real app, get from S3 upload
                })

                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id ? { ...f, status: 'completed', progress: 100 } : f
                ))
            }

            toast.success('All files uploaded successfully!')
            setTimeout(() => {
                navigate('/dashboard')
            }, 1000)

        } catch (error) {
            console.error('Upload failed:', error)
            toast.error('Failed to upload files')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 max-w-4xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Upload Files</h1>
                    <p className="text-muted-foreground">
                        Securely upload and encrypt your files
                    </p>
                </div>

                {/* Encryption Status */}
                <Card className={encryptionEnabled ? 'border-green-500' : 'border-orange-500'}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield className={`w-6 h-6 ${encryptionEnabled ? 'text-green-500' : 'text-orange-500'}`} />
                                <div>
                                    <p className="font-semibold">
                                        {encryptionEnabled ? 'Client-Side Encryption Enabled' : 'Encryption Disabled'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {encryptionEnabled
                                            ? 'Files will be encrypted on your device before upload'
                                            : 'Files will be uploaded without encryption (not recommended)'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={encryptionEnabled ? 'default' : 'outline'}
                                onClick={() => setEncryptionEnabled(!encryptionEnabled)}
                            >
                                {encryptionEnabled ? 'Enabled' : 'Disabled'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Drop Zone */}
                <Card
                    className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                >
                    <CardContent className="p-12">
                        <div className="flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <UploadIcon className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold mb-2">Drop files here to upload</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    or click to browse from your computer
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="file-input"
                                />
                                <label htmlFor="file-input">
                                    <Button type="button">
                                        Browse Files
                                    </Button>
                                </label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Maximum file size: 100MB • Supported: All file types
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* File List */}
                {files.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Selected Files ({files.length})</CardTitle>
                            <CardDescription>Review files before uploading</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {files.map(file => (
                                <FileItem
                                    key={file.id}
                                    file={file}
                                    onRemove={removeFile}
                                    uploading={uploading}
                                />
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Upload Button */}
                {files.length > 0 && (
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setFiles([])}
                            disabled={uploading}
                        >
                            Clear All
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="gap-2"
                        >
                            {uploading ? (
                                <>Uploading...</>
                            ) : (
                                <>
                                    <UploadIcon className="w-4 h-4" />
                                    Upload {files.length} File{files.length > 1 ? 's' : ''}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

const FileItem = ({ file, onRemove, uploading }) => {
    const getStatusBadge = () => {
        const statuses = {
            pending: <Badge variant="secondary">Pending</Badge>,
            hashing: <Badge variant="info" className="gap-1"><Hash className="w-3 h-3" />Hashing</Badge>,
            encrypting: <Badge variant="info" className="gap-1"><Shield className="w-3 h-3" />Encrypting</Badge>,
            uploading: <Badge variant="info">Uploading {file.progress}%</Badge>,
            completed: <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" />Completed</Badge>,
        }
        return statuses[file.status]
    }

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <FileText className="w-8 h-8 text-primary shrink-0" />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{file.name}</p>
                    {file.isSensitive && (
                        <Badge variant="warning" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Sensitive
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatBytes(file.size)}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">{file.category}</Badge>
                    <span>•</span>
                    {getStatusBadge()}
                </div>

                {file.status === 'uploading' && (
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                        />
                    </div>
                )}
            </div>

            {!uploading && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(file.id)}
                    className="shrink-0"
                >
                    <X className="w-4 h-4" />
                </Button>
            )}
        </div>
    )
}
