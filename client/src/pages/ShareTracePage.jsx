import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Link2, Eye, Download, Monitor, Smartphone, Tablet, MapPin, Clock, RefreshCw, Users, Globe, Loader2, Sparkles, Activity, Shield, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { shareApi } from '@/services/api'

export default function ShareTracePage() {
    const { linkId } = useParams()
    const navigate = useNavigate()
    const [trace, setTrace] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [refreshing, setRefreshing] = useState(false)

    const loadTrace = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)
            const response = await shareApi.getTrace(linkId)
            setTrace(response.data.trace)
        } catch (err) {
            console.error('Error loading trace:', err)
            setError(err.response?.data?.message || 'Failed to load access trace')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [linkId])

    useEffect(() => {
        loadTrace()
    }, [loadTrace])

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatTime = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const getActionBadge = (action) => {
        if (action === 'download') {
            return (
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
                    <Download className="w-3 h-3" />
                    Download
                </Badge>
            )
        }
        return (
            <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 gap-1">
                <Eye className="w-3 h-3" />
                View
            </Badge>
        )
    }

    const getDeviceIcon = (deviceType) => {
        const d = deviceType?.toLowerCase() || 'desktop'
        if (d === 'mobile') return <Smartphone className="w-4 h-4" />
        if (d === 'tablet') return <Tablet className="w-4 h-4" />
        return <Monitor className="w-4 h-4" />
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                        <div className="relative w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                        <Activity className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                        <p className="text-lg font-medium">Loading Access Trace</p>
                        <p className="text-muted-foreground animate-pulse">Gathering analytics data...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
                <Card className="max-w-md w-full overflow-hidden">
                    <div className="h-2 bg-linear-to-r from-destructive to-red-400"></div>
                    <CardHeader className="text-center pt-8">
                        <div className="relative inline-block mx-auto mb-4">
                            <div className="absolute inset-0 bg-destructive/20 blur-xl rounded-full"></div>
                            <div className="relative w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20">
                                <FileText className="w-10 h-10 text-destructive" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Error Loading Trace</CardTitle>
                        <CardDescription className="text-base">{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        <Button variant="outline" onClick={() => navigate(-1)} className="w-full h-12">
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
            <div className="container mx-auto p-6 max-w-6xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            className="gap-2 hover:bg-primary/10"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <div className="h-8 w-px bg-border"></div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                                <div className="relative w-14 h-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                                    <Activity className="w-7 h-7 text-primary" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-2">
                                    Link Analytics
                                    <Sparkles className="w-6 h-6 text-primary" />
                                </h1>
                                <p className="text-muted-foreground">
                                    Track who accessed your shared file
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadTrace(true)}
                        className="gap-2"
                        disabled={refreshing}
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className="h-1 bg-linear-to-r from-primary to-blue-500"></div>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FileText className="w-7 h-7 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-muted-foreground">File</p>
                                    <p className="font-bold text-lg truncate" title={trace?.fileName}>
                                        {trace?.fileName || 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className="h-1 bg-linear-to-r from-purple-500 to-pink-500"></div>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {trace?.accessMode === 'restricted' ? (
                                        <Shield className="w-7 h-7 text-purple-500" />
                                    ) : (
                                        <Globe className="w-7 h-7 text-purple-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Access Mode</p>
                                    <p className="font-bold text-lg capitalize">
                                        {trace?.accessMode || 'Public'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className="h-1 bg-linear-to-r from-green-500 to-emerald-500"></div>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-green-500/20 to-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Eye className="w-7 h-7 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Views</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-3xl">{trace?.totalViews || 0}</p>
                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <div className="h-1 bg-linear-to-r from-amber-500 to-orange-500"></div>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Download className="w-7 h-7 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Downloads</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-3xl">{trace?.totalDownloads || 0}</p>
                                        <TrendingUp className="w-4 h-4 text-amber-500" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Access Logs Table */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-linear-to-r from-muted/50 to-transparent border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Access History</CardTitle>
                                    <CardDescription>
                                        Detailed log of all access to this link
                                        {trace?.accessLogs?.length > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {trace.accessLogs.length} entries
                                            </Badge>
                                        )}
                                    </CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {trace?.accessLogs?.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-20 h-20 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-10 h-10 text-muted-foreground/50" />
                                </div>
                                <p className="text-lg font-medium mb-1">No access logs yet</p>
                                <p className="text-muted-foreground">
                                    Access history will appear here when someone uses the link
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Date & Time
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                IP Address
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Device
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Browser / OS
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {trace?.accessLogs?.map((log, index) => (
                                            <tr key={log.id || index} className="hover:bg-muted/30 transition-colors group">
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    {log.user ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold">
                                                                {log.user.name?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">
                                                                    {log.user.name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {log.user.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-muted/50">Anonymous</Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="font-medium">{formatDate(log.timestamp)}</div>
                                                    <div className="text-sm text-muted-foreground">{formatTime(log.timestamp)}</div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <code className="text-sm bg-muted px-3 py-1.5 rounded-lg font-mono">
                                                        {log.ip || 'Unknown'}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                        <span>
                                                            {log.location?.city !== 'Unknown'
                                                                ? `${log.location.city}, ${log.location.country}`
                                                                : 'Unknown'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg w-fit">
                                                        {getDeviceIcon(log.deviceType)}
                                                        <span className="capitalize">
                                                            {log.deviceType || 'Desktop'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="font-medium">{log.browser || 'Unknown'}</div>
                                                    <div className="text-sm text-muted-foreground">{log.os || 'Unknown'}</div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    {getActionBadge(log.action)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
