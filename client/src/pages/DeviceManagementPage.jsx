import React, { useState, useEffect, useCallback } from 'react'
import { Monitor, Chrome, MapPin, Clock, LogOut, Shield } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { deviceApi } from '@/services/api'

export const DeviceManagementPage = () => {
    const [devices, setDevices] = useState([])
    const [loading, setLoading] = useState(true)
    const toast = useToast()

    const fetchDevices = useCallback(async () => {
        try {
            const { data } = await deviceApi.getAll()
            setDevices(data)
        } catch (error) {
            console.error('Failed to fetch devices:', error)
            toast.error('Failed to load devices')
        } finally {
            setLoading(false)
        }
    }, [toast])

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
        if (confirm('Are you sure you want to logout all other devices?')) {
            try {
                await deviceApi.revokeAllOthers()
                // Refresh list to show only current device
                fetchDevices()
                toast.success('All other devices logged out')
            } catch (error) {
                console.error('Logout all failed:', error)
                toast.error('Failed to logout all devices')
            }
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Device Management</h1>
                        <p className="text-muted-foreground">
                            Manage devices that have access to your account
                        </p>
                    </div>
                    <Button onClick={handleLogoutAll} variant="destructive" className="gap-2">
                        <LogOut className="w-4 h-4" />
                        Logout All Devices
                    </Button>
                </div>

                {/* Security Alert */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-primary" />
                            <div>
                                <p className="font-semibold">Security Tip</p>
                                <p className="text-sm text-muted-foreground">
                                    If you see any suspicious activity, logout that device immediately and change your password
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Devices List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Devices</CardTitle>
                        <CardDescription>
                            {devices.length} device{devices.length !== 1 ? 's' : ''} with active sessions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {devices.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">No active devices found</div>
                        ) : (
                            devices.map(device => (
                                <div
                                    key={device._id}
                                    className={`p-4 rounded-lg border ${device.isCurrent ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Monitor className="w-6 h-6 text-primary" />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">{device.browser || 'Unknown Browser'}</p>
                                                    {device.isCurrent && (
                                                        <Badge variant="success">Current Device</Badge>
                                                    )}
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{device.location || 'Unknown Location'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>Last active: {formatDate(device.lastActive)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Chrome className="w-4 h-4" />
                                                        <span>IP: {device.ipAddress || 'Unknown IP'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            variant={device.isCurrent ? 'outline' : 'destructive'}
                                            size="sm"
                                            onClick={() => handleLogout(device._id, device.isCurrent)}
                                            disabled={device.isCurrent}
                                            className="gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {device.isCurrent ? 'Current' : 'Logout'}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>What is Device Management?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            Device management helps you keep track of all the devices that have accessed your account.
                            You can see when and where each login occurred and logout devices you don't recognize.
                        </p>
                        <p className="font-medium text-foreground mt-4">
                            Best Practices:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Regularly review your active devices</li>
                            <li>Logout devices you don't recognize immediately</li>
                            <li>Enable two-factor authentication for extra security</li>
                            <li>Use strong, unique passwords</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
