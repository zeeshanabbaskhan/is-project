import React, { useState, useEffect } from 'react'
import { User, Lock, Globe, Shield, Clock, Save } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export const SettingsPage = () => {
    const { user } = useAuth()
    const toast = useToast()

    const [profile, setProfile] = useState({
        name: user?.fullName || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: user.fullName || '',
                email: user.email || ''
            }))
        }
    }, [user])

    const [settings, setSettings] = useState({
        language: 'en',
        privacyMode: false,
        twoFactor: false,
        autoLogout: 30
    })

    const handleProfileUpdate = () => {
        // TODO: Implement API call
        toast.success('Profile updated successfully! (Local only)')
    }

    const handlePasswordChange = () => {
        if (profile.newPassword !== profile.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        // TODO: Implement API call
        toast.success('Password changed successfully! (Local only)')
        setProfile({ ...profile, currentPassword: '', newPassword: '', confirmPassword: '' })
    }

    const handleSettingsUpdate = () => {
        // TODO: Implement API call
        toast.success('Settings updated successfully! (Local only)')
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 max-w-4xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your account and security preferences
                    </p>
                </div>

                {/* Profile Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Update your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            />
                        </div>
                        <Button onClick={handleProfileUpdate} className="gap-2">
                            <Save className="w-4 h-4" />
                            Save Profile
                        </Button>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Change Password
                        </CardTitle>
                        <CardDescription>Update your account password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current Password</label>
                            <Input
                                type="password"
                                value={profile.currentPassword}
                                onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input
                                type="password"
                                value={profile.newPassword}
                                onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm New Password</label>
                            <Input
                                type="password"
                                value={profile.confirmPassword}
                                onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                            />
                        </div>
                        <Button onClick={handlePasswordChange} className="gap-2">
                            <Lock className="w-4 h-4" />
                            Update Password
                        </Button>
                    </CardContent>
                </Card>

                {/* Language */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            Language
                        </CardTitle>
                        <CardDescription>Choose your preferred language</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <select
                            value={settings.language}
                            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                            className="w-full p-2 rounded-md border border-input bg-background"
                        >
                            <option value="en">English</option>
                        </select>
                    </CardContent>
                </Card>

                {/* Security Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Security Preferences
                        </CardTitle>
                        <CardDescription>Configure security settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                                <p className="font-medium">Privacy Mode</p>
                                <p className="text-sm text-muted-foreground">
                                    Blur sensitive content by default
                                </p>
                            </div>
                            <Button
                                variant={settings.privacyMode ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSettings({ ...settings, privacyMode: !settings.privacyMode })}
                            >
                                {settings.privacyMode ? 'On' : 'Off'}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                                <p className="font-medium">Two-Factor Authentication</p>
                                <p className="text-sm text-muted-foreground">
                                    Add an extra layer of security
                                </p>
                            </div>
                            <Button
                                variant={settings.twoFactor ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSettings({ ...settings, twoFactor: !settings.twoFactor })}
                            >
                                {settings.twoFactor ? 'On' : 'Off'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Auto-Logout */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Auto-Logout Timer
                        </CardTitle>
                        <CardDescription>Set session timeout duration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Timeout (minutes)</label>
                            <Input
                                type="number"
                                value={settings.autoLogout}
                                onChange={(e) => setSettings({ ...settings, autoLogout: parseInt(e.target.value) })}
                                min="5"
                                max="120"
                            />
                            <p className="text-xs text-muted-foreground">
                                You'll be logged out after {settings.autoLogout} minutes of inactivity
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Button onClick={handleSettingsUpdate} className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    Save All Settings
                </Button>
            </div>
        </div>
    )
}
