import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Download, Share2, Trash2, Eye, EyeOff, Shield, Clock, Globe, TrendingUp, RotateCcw, ChevronDown } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatBytes, formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { fileApi, analyticsApi } from '@/services/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export const FileDetailPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [blurSensitive, setBlurSensitive] = useState(true)
    const toast = useToast()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fileRes, logsRes] = await Promise.all([
                    fileApi.getOne(id),
                    analyticsApi.getFileStats(id)
                ])
                setFile(fileRes.data)
                setLogs(logsRes.data)
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

    // Process logs for charts
    const accessData = logs.reduce((acc, log) => {
        const hour = new Date(log.createdAt).getHours()
        const time = `${hour}:00`
        const existing = acc.find(d => d.time === time)
        if (existing) {
            existing.views++
        } else {
            acc.push({ time, views: 1 })
        }
        return acc
    }, []).sort((a, b) => parseInt(a.time) - parseInt(b.time))

    const regionData = logs.reduce((acc, log) => {
        const region = log.location || 'Unknown'
        const existing = acc.find(d => d.name === region)
        if (existing) {
            existing.value++
        } else {
            acc.push({ name: region, value: 1 })
        }
        return acc
    }, [])

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!file) return null

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 max-w-6xl space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-primary" />
                            {file.originalName}
                        </h1>
                        <p className="text-muted-foreground">
                            {formatBytes(file.size)} • Uploaded {formatDate(file.createdAt)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Download
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => navigate(`/share/${id}`)}>
                            <Share2 className="w-4 h-4" />
                            Share
                        </Button>
                        <Button variant="destructive" className="gap-2" onClick={handleDelete}>
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Badges */}
                <div className="flex gap-2">
                    {file.encryption && (
                        <Badge variant="success" className="gap-1">
                            <Shield className="w-3 h-3" />
                            End-to-End Encrypted
                        </Badge>
                    )}
                    <Badge variant="secondary">{file.mimeType}</Badge>
                </div>

                {/* Preview Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>File Preview</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setBlurSensitive(!blurSensitive)}
                                className="gap-2"
                            >
                                {blurSensitive ? (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        Reveal Content
                                    </>
                                ) : (
                                    <>
                                        <EyeOff className="w-4 h-4" />
                                        Hide Content
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`bg-muted rounded-lg p-8 text-center ${blurSensitive ? 'blur-md' : ''}`}>
                            <FileText className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">Document Preview</p>
                            <p className="text-sm text-muted-foreground">
                                Click "Reveal Content" to view sensitive information
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Metadata */}
                <Card>
                    <CardHeader>
                        <CardTitle>File Metadata</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">File Name</p>
                                <p className="font-medium">{file.originalName}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">File Size</p>
                                <p className="font-medium">{formatBytes(file.size)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Upload Date</p>
                                <p className="font-medium">{formatDate(file.createdAt)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Encryption</p>
                                <Badge variant={file.encryption ? "success" : "secondary"}>
                                    {file.encryption ? "AES-256" : "None"}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Total Views</p>
                                <p className="font-medium">{logs.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Analytics */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Access Timeline</CardTitle>
                            <CardDescription>Views over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {accessData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={accessData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">No access data available</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Access by Region</CardTitle>
                            <CardDescription>Geographic distribution of views</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            {regionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={regionData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => entry.name}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {regionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">No region data available</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
