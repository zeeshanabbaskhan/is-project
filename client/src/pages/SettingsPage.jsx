import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Shield, Clock, Save, Trash2, Bell, Eye, Loader2, AlertTriangle, Smartphone, Copy, Check, X, Settings, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { authApi } from '@/services/api'

export const SettingsPage = () => {
    const { user, updateUser, logout } = useAuth()
    const navigate = useNavigate()
    const toast = useToast()

    const [profile, setProfile] = useState({
        name: user?.name || user?.fullName || '',
        email: user?.email || ''
    })

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const [settings, setSettings] = useState({
        privacyMode: false,
        autoLogoutMinutes: 30,
        emailNotifications: true,
        shareNotifications: true,
        twoFactorEnabled: false
    })

    const [deletePassword, setDeletePassword] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // 2FA states
    const [show2FASetup, setShow2FASetup] = useState(false)
    const [twoFactorData, setTwoFactorData] = useState(null)
    const [twoFactorCode, setTwoFactorCode] = useState('')
    const [setting2FA, setSetting2FA] = useState(false)
    const [disabling2FA, setDisabling2FA] = useState(false)
    const [show2FADisable, setShow2FADisable] = useState(false)
    const [disable2FAPassword, setDisable2FAPassword] = useState('')
    const [disable2FACode, setDisable2FACode] = useState('')
    const [copiedSecret, setCopiedSecret] = useState(false)

    const [loading, setLoading] = useState(true)
    const [savingProfile, setSavingProfile] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)
    const [savingSettings, setSavingSettings] = useState(false)
    const [deletingAccount, setDeletingAccount] = useState(false)

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const { data } = await authApi.getSettings()
                if (data.success) {
                    setSettings({
                        privacyMode: data.settings.privacyMode || false,
                        autoLogoutMinutes: data.settings.autoLogoutMinutes || 30,
                        emailNotifications: data.settings.emailNotifications !== false,
                        shareNotifications: data.settings.shareNotifications !== false,
                        twoFactorEnabled: data.settings.twoFactorEnabled || false
                    })
                }
            } catch (error) {
                console.error('Failed to load settings:', error)
            } finally {
                setLoading(false)
            }
        }
        loadSettings()
    }, [])

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || user.fullName || '',
                email: user.email || ''
            })
        }
    }, [user])

    const handleProfileUpdate = async () => {
        if (!profile.name.trim()) {
            toast.error('Name is required')
            return
        }
        try {
            setSavingProfile(true)
            const { data } = await authApi.updateProfile({ name: profile.name })
            if (data.success) {
                updateUser({ name: profile.name, fullName: profile.name })
                toast.success('Profile updated successfully!')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile')
        } finally {
            setSavingProfile(false)
        }
    }

    const handlePasswordChange = async () => {
        if (!passwords.currentPassword) {
            toast.error('Current password is required')
            return
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (passwords.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        try {
            setSavingPassword(true)
            const { data } = await authApi.changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            })
            if (data.success) {
                toast.success('Password changed successfully!')
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password')
        } finally {
            setSavingPassword(false)
        }
    }

    const handleSettingsUpdate = async () => {
        try {
            setSavingSettings(true)
            const { data } = await authApi.updateSettings({
                privacyMode: settings.privacyMode,
                autoLogoutMinutes: settings.autoLogoutMinutes,
                emailNotifications: settings.emailNotifications,
                shareNotifications: settings.shareNotifications
            })
            if (data.success) {
                toast.success('Settings saved successfully!')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save settings')
        } finally {
            setSavingSettings(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            toast.error('Password is required to delete account')
            return
        }
        try {
            setDeletingAccount(true)
            const { data } = await authApi.deleteAccount(deletePassword)
            if (data.success) {
                toast.success('Account deleted successfully')
                await logout()
                navigate('/login')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete account')
        } finally {
            setDeletingAccount(false)
        }
    }

    // 2FA Handlers
    const handleSetup2FA = async () => {
        try {
            setSetting2FA(true)
            const { data } = await authApi.setup2FA()
            if (data.success) {
                setTwoFactorData(data)
                setShow2FASetup(true)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to setup 2FA')
        } finally {
            setSetting2FA(false)
        }
    }

    const handleEnable2FA = async () => {
        if (!twoFactorCode || twoFactorCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code')
            return
        }
        try {
            setSetting2FA(true)
            const { data } = await authApi.enable2FA(twoFactorCode)
            if (data.success) {
                setSettings({ ...settings, twoFactorEnabled: true })
                setShow2FASetup(false)
                setTwoFactorData(null)
                setTwoFactorCode('')
                toast.success('Two-factor authentication enabled!')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid verification code')
        } finally {
            setSetting2FA(false)
        }
    }

    const handleDisable2FA = async () => {
        if (!disable2FAPassword) {
            toast.error('Password is required')
            return
        }
        if (!disable2FACode || disable2FACode.length !== 6) {
            toast.error('Please enter a valid 6-digit code')
            return
        }
        try {
            setDisabling2FA(true)
            const { data } = await authApi.disable2FA(disable2FAPassword, disable2FACode)
            if (data.success) {
                setSettings({ ...settings, twoFactorEnabled: false })
                setShow2FADisable(false)
                setDisable2FAPassword('')
                setDisable2FACode('')
                toast.success('Two-factor authentication disabled')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to disable 2FA')
        } finally {
            setDisabling2FA(false)
        }
    }

    const copySecret = () => {
        if (twoFactorData?.manualEntryKey) {
            navigator.clipboard.writeText(twoFactorData.manualEntryKey)
            setCopiedSecret(true)
            setTimeout(() => setCopiedSecret(false), 2000)
        }
    }

    const cancel2FASetup = () => {
        setShow2FASetup(false)
        setTwoFactorData(null)
        setTwoFactorCode('')
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Settings className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                </div>
                <p className="text-muted-foreground animate-pulse">Loading settings...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-40 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="container mx-auto p-6 max-w-4xl space-y-6 relative">
                {/* Header */}
                <div className="flex items-center gap-4 pb-2">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Settings className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-muted-foreground">
                            Manage your account and security preferences
                        </p>
                    </div>
                </div>

                {/* Profile Information */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-500" />
                            </div>
                            Profile Information
                        </CardTitle>
                        <CardDescription>Update your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="Your name"
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                value={profile.email}
                                disabled
                                className="bg-muted h-11"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>
                        <Button onClick={handleProfileUpdate} className="gap-2 shadow-sm" disabled={savingProfile}>
                            {savingProfile ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Profile
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-purple-500" />
                            </div>
                            Change Password
                        </CardTitle>
                        <CardDescription>Update your account password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current Password</label>
                            <Input
                                type="password"
                                value={passwords.currentPassword}
                                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                placeholder="Enter current password"
                                className="h-11"
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <Input
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    placeholder="Enter new password"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm New Password</label>
                                <Input
                                    type="password"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    placeholder="Confirm new password"
                                    className="h-11"
                                />
                            </div>
                        </div>
                        <Button onClick={handlePasswordChange} className="gap-2 shadow-sm" disabled={savingPassword}>
                            {savingPassword ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    Update Password
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Privacy & Security Settings */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-green-500" />
                            </div>
                            Privacy & Security
                        </CardTitle>
                        <CardDescription>Configure your security preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="font-medium">Privacy Mode</p>
                                    <p className="text-sm text-muted-foreground">
                                        Blur sensitive content by default
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={settings.privacyMode ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSettings({ ...settings, privacyMode: !settings.privacyMode })}
                                className={settings.privacyMode ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                            >
                                {settings.privacyMode ? '✓ On' : 'Off'}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="font-medium flex items-center gap-2">
                                        Two-Factor Authentication
                                        {settings.twoFactorEnabled && (
                                            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Active</Badge>
                                        )}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {settings.twoFactorEnabled
                                            ? 'Your account is protected with 2FA'
                                            : 'Add an extra layer of security'}
                                    </p>
                                </div>
                            </div>
                            {settings.twoFactorEnabled ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShow2FADisable(true)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    Disable
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSetup2FA}
                                    disabled={setting2FA}
                                    className="hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30"
                                >
                                    {setting2FA ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Enable'
                                    )}
                                </Button>
                            )}
                        </div>

                        {/* 2FA Setup Modal */}
                        {show2FASetup && twoFactorData && (
                            <div className="p-5 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-5">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-lg flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                            <Shield className="w-4 h-4 text-primary" />
                                        </div>
                                        Setup Two-Factor Authentication
                                    </h4>
                                    <Button variant="ghost" size="sm" onClick={cancel2FASetup}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                        </p>
                                        <div className="flex justify-center bg-white p-5 rounded-xl w-fit mx-auto shadow-lg">
                                            <img
                                                src={twoFactorData.qrCode}
                                                alt="2FA QR Code"
                                                className="w-52 h-52"
                                            />
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Or enter this key manually:
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <code className="bg-muted px-4 py-2.5 rounded-lg font-mono text-sm tracking-wider border">
                                                {twoFactorData.manualEntryKey}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={copySecret}
                                                className="h-9 w-9 p-0"
                                            >
                                                {copiedSecret ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            2. Enter the 6-digit code from your app to verify:
                                        </p>
                                        <div className="flex gap-3 max-w-xs mx-auto">
                                            <Input
                                                type="text"
                                                value={twoFactorCode}
                                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="000000"
                                                className="text-center text-2xl tracking-[0.5em] font-mono h-12"
                                                maxLength={6}
                                            />
                                            <Button
                                                onClick={handleEnable2FA}
                                                disabled={setting2FA || twoFactorCode.length !== 6}
                                                className="h-12 px-6"
                                            >
                                                {setting2FA ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    'Verify'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2FA Disable Modal */}
                        {show2FADisable && (
                            <div className="p-5 rounded-xl border-2 border-destructive/30 bg-destructive/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-lg flex items-center gap-2 text-destructive">
                                        <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        Disable Two-Factor Authentication
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShow2FADisable(false)
                                            setDisable2FAPassword('')
                                            setDisable2FACode('')
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    This will remove the extra security from your account. You'll need to enter your password and a code from your authenticator app.
                                </p>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Password</label>
                                        <Input
                                            type="password"
                                            value={disable2FAPassword}
                                            onChange={(e) => setDisable2FAPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Authentication Code</label>
                                        <Input
                                            type="text"
                                            value={disable2FACode}
                                            onChange={(e) => setDisable2FACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            className="text-center font-mono tracking-widest h-11"
                                            maxLength={6}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShow2FADisable(false)
                                            setDisable2FAPassword('')
                                            setDisable2FACode('')
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDisable2FA}
                                        disabled={disabling2FA}
                                        className="shadow-sm"
                                    >
                                        {disabling2FA ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Disabling...
                                            </>
                                        ) : (
                                            'Disable 2FA'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <Bell className="w-4 h-4 text-orange-500" />
                            </div>
                            Notifications
                        </CardTitle>
                        <CardDescription>Manage your notification preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="font-medium">Email Notifications</p>
                                    <p className="text-sm text-muted-foreground">
                                        Receive important updates via email
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={settings.emailNotifications ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                            >
                                {settings.emailNotifications ? '✓ On' : 'Off'}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-pink-500" />
                                </div>
                                <div>
                                    <p className="font-medium">Share Notifications</p>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when someone shares a file with you
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={settings.shareNotifications ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSettings({ ...settings, shareNotifications: !settings.shareNotifications })}
                            >
                                {settings.shareNotifications ? '✓ On' : 'Off'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Auto-Logout */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-cyan-500" />
                            </div>
                            Session Settings
                        </CardTitle>
                        <CardDescription>Configure session timeout</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Auto-Logout Timer (minutes)</label>
                            <Input
                                type="number"
                                value={settings.autoLogoutMinutes}
                                onChange={(e) => setSettings({ ...settings, autoLogoutMinutes: parseInt(e.target.value) || 30 })}
                                min="5"
                                max="120"
                                className="max-w-[200px] h-11"
                            />
                            <p className="text-sm text-muted-foreground">
                                You'll be logged out after {settings.autoLogoutMinutes} minutes of inactivity (5-120 minutes)
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Settings Button */}
                <Button onClick={handleSettingsUpdate} className="w-full gap-2 h-12 text-base shadow-lg" disabled={savingSettings}>
                    {savingSettings ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving Settings...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save All Settings
                        </>
                    )}
                </Button>

                {/* Danger Zone */}
                <Card className="border-destructive/50 overflow-hidden">
                    <CardHeader className="bg-destructive/5 border-b border-destructive/20">
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            Danger Zone
                        </CardTitle>
                        <CardDescription>Irreversible actions</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                                    <Trash2 className="w-5 h-5 text-destructive" />
                                </div>
                                <div>
                                    <p className="font-medium">Delete Account</p>
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete your account and all data
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="shadow-sm"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>

                        {showDeleteConfirm && (
                            <div className="p-5 rounded-xl border-2 border-destructive bg-destructive/10 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-destructive/30 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-destructive" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg text-destructive">Are you absolutely sure?</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            This action cannot be undone. This will permanently delete your account,
                                            all your files, notes, and shared links.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Enter your password to confirm</label>
                                    <Input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        placeholder="Your password"
                                        className="h-11"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowDeleteConfirm(false)
                                            setDeletePassword('')
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteAccount}
                                        disabled={deletingAccount}
                                        className="shadow-lg"
                                    >
                                        {deletingAccount ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Yes, Delete My Account
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
