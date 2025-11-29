import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Monitor, Chrome, MapPin, Clock, LogOut, Shield, Smartphone, Laptop, Tablet, AlertTriangle, CheckCircle, Lock, Fingerprint, Globe } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { deviceApi } from '@/services/api'

export const DeviceManagementPage = () => {
    const [devices, setDevices] = useState([])
    const [loading, setLoading] = useState(true)
    const toast = useToast()
    const navigate = useNavigate()
    const { logout } = useAuth()

    const fetchDevices = useCallback(async () => {
        try {
            const { data } = await deviceApi.getAll()
            // Handle backend response format: { success: true, devices: [...] }
            setDevices(data?.devices || data || [])
        } catch (error) {
            console.error('Failed to fetch devices:', error)
            // Don't show toast here to avoid loops - only on initial load
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDevices()
    }, [fetchDevices])

    const handleLogout = async (deviceId, current) => {
        if (current) {
            toast.warning('Cannot logout current device')
            return
        }
        try {
            await deviceApi.revoke(deviceId)
            setDevices(devices.filter(d => d._id !== deviceId))
            toast.success('Device logged out successfully')
        } catch (error) {
            console.error('Logout failed:', error)
            toast.error('Failed to logout device')
        }
    }

    const handleLogoutAll = async () => {
        if (confirm('Are you sure you want to logout all devices including this one? You will be redirected to login.')) {
            try {
                await deviceApi.revokeAll()
                // Logout current user and redirect to login
                await logout()
                navigate('/login')
            } catch (error) {
                console.error('Logout all failed:', error)
                toast.error('Failed to logout all devices')
            }
        }
    }

    const getDeviceIcon = (device) => {
        const name = (device.deviceName || device.browser || '').toLowerCase()
        if (name.includes('mobile') || name.includes('iphone') || name.includes('android')) return Smartphone
        if (name.includes('tablet') || name.includes('ipad')) return Tablet
        if (name.includes('laptop')) return Laptop
        return Monitor
    }

    const currentDevice = devices.find(d => d.isCurrentDevice || d.isCurrent)
    const otherDevices = devices.filter(d => !(d.isCurrentDevice || d.isCurrent))

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Monitor className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
                <p className="text-muted-foreground animate-pulse">Loading devices...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-40 right-20 w-72 h-72 bg-green-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-40 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="container mx-auto p-6 max-w-6xl space-y-6 relative">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Fingerprint className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Device Management</h1>
                            <p className="text-muted-foreground">
                                Manage devices that have access to your account
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleLogoutAll} variant="destructive" className="gap-2 shadow-lg">
                        <LogOut className="w-4 h-4" />
                        Logout All Devices
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Devices', value: devices.length, icon: Monitor, color: 'text-blue-500 bg-blue-500/10' },
                        { label: 'Current Device', value: currentDevice ? '✓' : '-', icon: CheckCircle, color: 'text-green-500 bg-green-500/10' },
                        { label: 'Other Sessions', value: otherDevices.length, icon: Globe, color: 'text-purple-500 bg-purple-500/10' },
                        { label: 'Security Status', value: 'Secure', icon: Shield, color: 'text-emerald-500 bg-emerald-500/10' },
                    ].map((stat, idx) => (
                        <Card key={idx} className="overflow-hidden hover:shadow-md transition-shadow">
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

                {/* Security Alert */}
                <Card className="overflow-hidden border-primary/30 bg-linear-to-r from-primary/10 to-primary/5">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                <Shield className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-lg">Security Tip</p>
                                <p className="text-sm text-muted-foreground">
                                    If you see any suspicious activity, logout that device immediately and change your password. Enable 2FA for extra protection.
                                </p>
                            </div>
                            <Button variant="outline" size="sm" className="shrink-0 gap-2" onClick={() => navigate('/settings')}>
                                <Lock className="w-4 h-4" />
                                Security Settings
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Current Device */}
                {currentDevice && (
                    <Card className="overflow-hidden border-green-500/30">
                        <CardHeader className="bg-green-500/5 border-b border-green-500/20 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <CardTitle className="text-lg">Current Device</CardTitle>
                            </div>
                            <CardDescription>This is the device you're using right now</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5">
                            <DeviceCard
                                device={currentDevice}
                                isCurrent={true}
                                getDeviceIcon={getDeviceIcon}
                                onLogout={handleLogout}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Other Devices */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-muted-foreground" />
                                    Other Active Sessions
                                </CardTitle>
                                <CardDescription>
                                    {otherDevices.length} other device{otherDevices.length !== 1 ? 's' : ''} with active sessions
                                </CardDescription>
                            </div>
                            {otherDevices.length > 0 && (
                                <Badge variant="secondary" className="gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Review these devices
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        {otherDevices.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <p className="text-lg font-medium mb-1">No other active sessions</p>
                                <p className="text-sm text-muted-foreground">
                                    You're only logged in on this device
                                </p>
                            </div>
                        ) : (
                            otherDevices.map(device => (
                                <DeviceCard
                                    key={device._id || device.id}
                                    device={device}
                                    isCurrent={false}
                                    getDeviceIcon={getDeviceIcon}
                                    onLogout={handleLogout}
                                />
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Best Practices */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Security Best Practices
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { icon: Monitor, title: 'Regular Reviews', desc: 'Check your active devices regularly' },
                                { icon: AlertTriangle, title: 'Suspicious Activity', desc: 'Logout unknown devices immediately' },
                                { icon: Lock, title: 'Two-Factor Auth', desc: 'Enable 2FA for extra security' },
                                { icon: Fingerprint, title: 'Strong Passwords', desc: 'Use unique, complex passwords' },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <item.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

const DeviceCard = ({ device, isCurrent, getDeviceIcon, onLogout }) => {
    const DeviceIcon = getDeviceIcon(device)

    return (
        <div className={`flex items-start justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${isCurrent ? 'bg-green-500/5 border-green-500/30' : 'bg-card hover:bg-muted/30'
            }`}>
            <div className="flex gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? 'bg-green-500/20' : 'bg-primary/10'
                    }`}>
                    <DeviceIcon className={`w-7 h-7 ${isCurrent ? 'text-green-500' : 'text-primary'}`} />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">{device.deviceName || device.browser || 'Unknown Browser'}</p>
                        {isCurrent && (
                            <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                                Current
                            </Badge>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground/70" />
                            <span>{typeof device.location === 'string' ? device.location : (device.location?.city ? `${device.location.city}, ${device.location.country || ''}` : 'Unknown Location')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground/70" />
                            <span>Last active: {formatDate(device.lastActivity || device.lastActive)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Chrome className="w-4 h-4 text-muted-foreground/70" />
                            <span>IP: {device.ip || device.ipAddress || 'Unknown IP'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Button
                variant={isCurrent ? 'outline' : 'destructive'}
                size="sm"
                onClick={() => onLogout(device._id || device.id, isCurrent)}
                disabled={isCurrent}
                className={`gap-2 shrink-0 ${!isCurrent ? 'shadow-sm' : ''}`}
            >
                <LogOut className="w-4 h-4" />
                {isCurrent ? 'This Device' : 'Logout'}
            </Button>
        </div>
    )
}
