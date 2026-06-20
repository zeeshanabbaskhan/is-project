import React, { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload as UploadIcon, FileText, X, Shield, AlertTriangle, CheckCircle, Hash, Cloud, Sparkles, Lock, Zap, FileImage, FileVideo, FileAudio, FileArchive, File } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatBytes, detectSensitiveContent, categorizefile } from '@/lib/utils'
import { fileApi } from '@/services/api'

// Vercel serverless request body limit is ~4.5MB
const MAX_FILE_SIZE = 4 * 1024 * 1024

export const UploadPage = () => {
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [encryptionEnabled, setEncryptionEnabled] = useState(true)
    const [isDragging, setIsDragging] = useState(false)
    const toast = useToast()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const openFilePicker = () => {
        fileInputRef.current?.click()
    }

    const processFiles = useCallback(async (newFiles) => {
        const oversized = newFiles.filter(f => f.size > MAX_FILE_SIZE)
        if (oversized.length > 0) {
            toast.error(`${oversized.length} file(s) exceed the ${formatBytes(MAX_FILE_SIZE)} upload limit`)
        }

        const validFiles = newFiles.filter(f => f.size <= MAX_FILE_SIZE)
        if (validFiles.length === 0) return

        const processedFiles = await Promise.all(
            validFiles.map(async (file) => {
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
        setIsDragging(false)
        const droppedFiles = Array.from(e.dataTransfer.files)
        processFiles(droppedFiles)
    }, [processFiles])

    const onDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const onDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files)
        if (selectedFiles.length > 0) {
            processFiles(selectedFiles)
        }
        e.target.value = ''
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

                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id ? { ...f, status: 'uploading' } : f
                ))

                const formData = new FormData()
                formData.append('file', fileItem.file)
                formData.append('category', fileItem.category)

                await fileApi.upload(formData)

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
            const message = error.response?.data?.message || error.message || 'Failed to upload files'
            toast.error(message)
            setFiles(prev => prev.map(f =>
                f.status !== 'completed' ? { ...f, status: 'failed' } : f
            ))
        } finally {
            setUploading(false)
        }
    }

    const completedCount = files.filter(f => f.status === 'completed').length
    const totalSize = files.reduce((acc, f) => acc + f.size, 0)

    return (
        <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="container mx-auto p-6 max-w-4xl space-y-6 relative">
                {/* Header */}
                <div className="text-center py-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        Secure Upload
                    </div>
                    <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
                        Upload Your Files
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto">
                        Your files are encrypted before leaving your device
                    </p>
                </div>

                {/* Security Features */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { icon: Lock, label: 'End-to-End Encrypted', color: 'text-green-500 bg-green-500/10' },
                        { icon: Zap, label: 'Lightning Fast', color: 'text-yellow-500 bg-yellow-500/10' },
                        { icon: Shield, label: 'Zero Knowledge', color: 'text-blue-500 bg-blue-500/10' },
                    ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border">
                            <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center`}>
                                <feature.icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium">{feature.label}</span>
                        </div>
                    ))}
                </div>

                {/* Encryption Toggle */}
                <Card className={`overflow-hidden transition-all duration-300 ${encryptionEnabled ? 'border-green-500/50 bg-green-500/5' : 'border-orange-500/50 bg-orange-500/5'}`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${encryptionEnabled ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                                    <Shield className={`w-6 h-6 ${encryptionEnabled ? 'text-green-500' : 'text-orange-500'}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">
                                        {encryptionEnabled ? 'Client-Side Encryption' : 'Encryption Disabled'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {encryptionEnabled
                                            ? 'Files encrypted on your device before upload'
                                            : 'Files will be uploaded without encryption'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={encryptionEnabled ? 'default' : 'outline'}
                                onClick={() => setEncryptionEnabled(!encryptionEnabled)}
                                className={encryptionEnabled ? 'bg-green-600 hover:bg-green-700' : ''}
                            >
                                {encryptionEnabled ? '✓ Enabled' : 'Enable'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Drop Zone */}
                <Card
                    className={`border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${isDragging
                            ? 'border-primary bg-primary/10 scale-[1.02]'
                            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
                        }`}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onClick={openFilePicker}
                >
                    <CardContent className="p-16">
                        <div className="flex flex-col items-center justify-center gap-6 text-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className={`relative transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
                                <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <Cloud className="w-12 h-12 text-primary" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                    <UploadIcon className="w-5 h-5 text-green-500" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xl font-semibold mb-2">
                                    {isDragging ? 'Drop your files here!' : 'Drag & drop files to upload'}
                                </p>
                                <p className="text-muted-foreground mb-6">
                                    or click to browse from your computer
                                </p>
                                <Button
                                    type="button"
                                    size="lg"
                                    className="gap-2 shadow-lg"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openFilePicker()
                                    }}
                                >
                                    <UploadIcon className="w-5 h-5" />
                                    Browse Files
                                </Button>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                                <span className="px-3 py-1.5 bg-muted rounded-full">Max {formatBytes(MAX_FILE_SIZE)} per file</span>
                                <span className="px-3 py-1.5 bg-muted rounded-full">All file types</span>
                                <span className="px-3 py-1.5 bg-muted rounded-full">Unlimited files</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* File List */}
                {files.length > 0 && (
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        Selected Files
                                        <Badge variant="secondary" className="ml-2">{files.length}</Badge>
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Total size: {formatBytes(totalSize)}
                                        {completedCount > 0 && ` • ${completedCount}/${files.length} uploaded`}
                                    </CardDescription>
                                </div>
                                {uploading && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
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
                    <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
                        <div className="text-sm text-muted-foreground">
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    Uploading {completedCount + 1} of {files.length}...
                                </span>
                            ) : (
                                <span>Ready to upload {files.length} file{files.length > 1 ? 's' : ''}</span>
                            )}
                        </div>
                        <div className="flex gap-3">
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
                                className="gap-2 min-w-[140px] shadow-lg"
                                size="lg"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <UploadIcon className="w-5 h-5" />
                                        Upload All
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const FileItem = ({ file, onRemove, uploading }) => {
    const getFileIcon = () => {
        const type = file.type || ''
        if (type.startsWith('image/')) return FileImage
        if (type.startsWith('video/')) return FileVideo
        if (type.startsWith('audio/')) return FileAudio
        if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return FileArchive
        return FileText
    }

    const FileIcon = getFileIcon()

    const getStatusBadge = () => {
        const statuses = {
            pending: <Badge variant="secondary" className="gap-1"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>Pending</Badge>,
            hashing: <Badge className="gap-1 bg-blue-500/10 text-blue-500 border-blue-500/20"><Hash className="w-3 h-3 animate-spin" />Hashing</Badge>,
            encrypting: <Badge className="gap-1 bg-purple-500/10 text-purple-500 border-purple-500/20"><Shield className="w-3 h-3 animate-pulse" />Encrypting</Badge>,
            uploading: <Badge className="gap-1 bg-orange-500/10 text-orange-500 border-orange-500/20"><UploadIcon className="w-3 h-3 animate-bounce" />Uploading</Badge>,
            completed: <Badge className="gap-1 bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3" />Completed</Badge>,
            failed: <Badge className="gap-1 bg-red-500/10 text-red-500 border-red-500/20"><AlertTriangle className="w-3 h-3" />Failed</Badge>,
        }
        return statuses[file.status]
    }

    return (
        <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${file.status === 'completed'
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-card hover:bg-muted/30'
            }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${file.status === 'completed' ? 'bg-green-500/20' : 'bg-primary/10'
                }`}>
                <FileIcon className={`w-6 h-6 ${file.status === 'completed' ? 'text-green-500' : 'text-primary'}`} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{file.name}</p>
                    {file.isSensitive && (
                        <Badge variant="warning" className="gap-1 shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            Sensitive
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium">{formatBytes(file.size)}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <Badge variant="outline" className="text-xs capitalize">{file.category}</Badge>
                    <span className="text-muted-foreground/50">•</span>
                    {getStatusBadge()}
                </div>

                {(file.status === 'uploading' || file.status === 'hashing' || file.status === 'encrypting') && (
                    <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
                        <div
                            className="h-1.5 rounded-full transition-all duration-300 bg-linear-to-r from-primary to-primary/60"
                            style={{
                                width: file.status === 'uploading' ? `${file.progress}%` : '100%',
                                animation: file.status !== 'uploading' ? 'pulse 1s infinite' : 'none'
                            }}
                        />
                    </div>
                )}
            </div>

            {!uploading && file.status !== 'completed' && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(file.id)}
                    className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
                >
                    <X className="w-4 h-4" />
                </Button>
            )}

            {file.status === 'completed' && (
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
            )}
        </div>
    )
}
