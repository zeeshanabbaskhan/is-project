import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Link2, Copy, Mail, Lock, Clock, Download, Eye, Shield, Users, Globe, Search, X, UserPlus, Sparkles, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { shareApi, authApi } from '@/services/api'

export const ShareSettingsPage = () => {
    const { id } = useParams()
    const toast = useToast()
    const navigate = useNavigate()

    const [settings, setSettings] = useState({
        passwordProtection: false,
        password: '',
        expiryEnabled: false,
        expiryDays: '',
        expiryHours: '',
        expiryMinutes: '',
        maxDownloads: '',
        oneTimeAccess: false,
        trackLink: true,
        recipientEmails: '',
        accessMode: 'public', // 'public' or 'restricted'
        allowedUsers: [] // For restricted mode
    })

    // Calculate expiry date/time based on settings
    const calculateExpiryDate = () => {
        const days = parseInt(settings.expiryDays) || 0
        const hours = parseInt(settings.expiryHours) || 0
        const minutes = parseInt(settings.expiryMinutes) || 0

        if (days === 0 && hours === 0 && minutes === 0) return null

        const expiry = new Date()
        expiry.setDate(expiry.getDate() + days)
        expiry.setHours(expiry.getHours() + hours)
        expiry.setMinutes(expiry.getMinutes() + minutes)
        return expiry
    }

    const expiryDate = settings.expiryEnabled ? calculateExpiryDate() : null

    const [shareLink, setShareLink] = useState('')
    const [linkAccessMode, setLinkAccessMode] = useState(null) // Track access mode when link was generated
    const [userSearchQuery, setUserSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }))
    }

    // Debounced user search
    const searchUsers = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            const { data } = await authApi.searchUsers(query)
            setSearchResults(data.users || [])
        } catch (error) {
            console.error('User search failed:', error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }, [])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (userSearchQuery.length >= 2) {
                searchUsers(userSearchQuery)
            } else {
                setSearchResults([])
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [userSearchQuery, searchUsers])

    const handleAddUser = (user) => {
        // Check if user is already added
        if (settings.allowedUsers.some(u => u._id === user._id)) {
            toast.error('User already added')
            return
        }

        setSettings(prev => ({
            ...prev,
            allowedUsers: [...prev.allowedUsers, user]
        }))
        setUserSearchQuery('')
        setSearchResults([])
        setShowSearchDropdown(false)
    }

    const handleRemoveUser = (userId) => {
        setSettings(prev => ({
            ...prev,
            allowedUsers: prev.allowedUsers.filter(u => u._id !== userId)
        }))
    }

    const handleGenerateLink = async (recipientEmail = null) => {
        try {
            // Validate restricted mode has at least one user
            if (settings.accessMode === 'restricted' && settings.allowedUsers.length === 0 && !recipientEmail) {
                toast.error('Please add at least one user for restricted access')
                return null
            }

            let expiresAt = null
            if (settings.expiryEnabled) {
                const days = parseInt(settings.expiryDays) || 0
                const hours = parseInt(settings.expiryHours) || 0
                const minutes = parseInt(settings.expiryMinutes) || 0

                if (days > 0 || hours > 0 || minutes > 0) {
                    const now = new Date()
                    now.setDate(now.getDate() + days)
                    now.setHours(now.getHours() + hours)
                    now.setMinutes(now.getMinutes() + minutes)
                    expiresAt = now.toISOString()
                }
            }

            const payload = {
                fileId: id,
                permissions: 'download',
                expiresAt,
                maxDownloads: settings.maxDownloads ? parseInt(settings.maxDownloads) : null,
                password: settings.passwordProtection ? settings.password : null,
                notifyOnAccess: settings.trackLink,
                recipientEmail: recipientEmail,
                accessMode: settings.accessMode,
                allowedUsers: settings.accessMode === 'restricted'
                    ? settings.allowedUsers.map(u => u._id)
                    : [],
                oneTimeAccess: settings.oneTimeAccess || false
            }

            const { data } = await shareApi.create(payload)
            // Handle backend response format
            const token = data?.shareLink?.token || data?.token
            const link = `${window.location.origin}/share/public/${token}`
            setShareLink(link)
            setLinkAccessMode(settings.accessMode) // Store the access mode when link was generated
            return { link, token }
        } catch (error) {
            console.error('Failed to generate link:', error)
            toast.error(error.response?.data?.message || 'Failed to generate link')
            return null
        }
    }

    const handleGenerateLinkButton = async () => {
        const result = await handleGenerateLink()
        if (result) {
            toast.success('Share link generated!')
        }
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink)
        toast.success('Link copied to clipboard!')
    }

    const handleSendEmail = async () => {
        if (!settings.recipientEmails) {
            toast.error('Please enter recipient email addresses')
            return
        }

        // Parse emails and create share for each recipient
        const emails = settings.recipientEmails.split(',').map(e => e.trim()).filter(e => e)

        if (emails.length === 0) {
            toast.error('Please enter valid email addresses')
            return
        }

        let successCount = 0
        for (const email of emails) {
            // Validate email format
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                toast.error(`Invalid email format: ${email}`)
                continue
            }

            const result = await handleGenerateLink(email)
            if (result) {
                successCount++
            }
        }

        if (successCount > 0) {
            toast.success(`File shared with ${successCount} recipient(s)! They can now see it in their inbox.`)
        }
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
            <div className="container mx-auto p-6 max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 hover:bg-primary/10">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <div className="h-8 w-px bg-border"></div>
                        <div>
                            <h1 className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-2">
                                Share Settings
                                <Sparkles className="w-6 h-6 text-primary" />
                            </h1>
                            <p className="text-muted-foreground">
                                Configure security settings for sharing this file
                            </p>
                        </div>
                    </div>
                </div>

                {/* Access Mode Selection */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-linear-to-r from-muted/50 to-transparent border-b">
                        <CardTitle className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            Access Mode
                        </CardTitle>
                        <CardDescription>Choose who can access this file via the link</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Public Access Option */}
                            <div
                                className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${settings.accessMode === 'public'
                                    ? 'border-primary bg-linear-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/10'
                                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                    }`}
                                onClick={() => handleChange('accessMode', 'public')}
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${settings.accessMode === 'public' ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted'
                                        }`}>
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg">Public Access</h4>
                                        {settings.accessMode === 'public' && (
                                            <Badge className="bg-primary/20 text-primary border-0">Selected</Badge>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Anyone with the link can view or download this file. No login required.
                                </p>
                            </div>

                            {/* Restricted Access Option */}
                            <div
                                className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${settings.accessMode === 'restricted'
                                    ? 'border-primary bg-linear-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/10'
                                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                    }`}
                                onClick={() => handleChange('accessMode', 'restricted')}
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${settings.accessMode === 'restricted' ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted'
                                        }`}>
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg">Selected Users Only</h4>
                                        {settings.accessMode === 'restricted' && (
                                            <Badge className="bg-primary/20 text-primary border-0">Selected</Badge>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Only specific users you select can access. Login required.
                                </p>
                            </div>
                        </div>

                        {/* User Selection for Restricted Mode */}
                        {settings.accessMode === 'restricted' && (
                            <div className="mt-6 space-y-4 p-5 bg-muted/30 rounded-xl border">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <UserPlus className="w-4 h-4 text-primary" />
                                        Add Users
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Search users by name or email..."
                                            value={userSearchQuery}
                                            onChange={(e) => {
                                                setUserSearchQuery(e.target.value)
                                                setShowSearchDropdown(true)
                                            }}
                                            onFocus={() => setShowSearchDropdown(true)}
                                            className="pl-11 h-12"
                                        />

                                        {/* Search Results Dropdown */}
                                        {showSearchDropdown && (userSearchQuery.length >= 2) && (
                                            <div className="absolute z-10 w-full mt-2 bg-background border-2 rounded-xl shadow-xl max-h-60 overflow-auto">
                                                {isSearching ? (
                                                    <div className="p-4 text-center text-muted-foreground">
                                                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                                                        Searching...
                                                    </div>
                                                ) : searchResults.length > 0 ? (
                                                    searchResults.map(user => (
                                                        <div
                                                            key={user._id}
                                                            className="flex items-center justify-between p-4 hover:bg-primary/5 cursor-pointer transition-colors"
                                                            onClick={() => handleAddUser(user)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                                                    {user.avatar ? (
                                                                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl" />
                                                                    ) : (
                                                                        <span className="text-base font-semibold text-primary">
                                                                            {user.name?.charAt(0)?.toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium">{user.name}</p>
                                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                                </div>
                                                            </div>
                                                            <UserPlus className="w-5 h-5 text-primary" />
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-muted-foreground">
                                                        No users found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Type at least 2 characters to search
                                    </p>
                                </div>

                                {/* Selected Users */}
                                {settings.allowedUsers.length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            Selected Users ({settings.allowedUsers.length})
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {settings.allowedUsers.map(user => (
                                                <Badge
                                                    key={user._id}
                                                    variant="secondary"
                                                    className="flex items-center gap-2 py-2 px-4 text-sm bg-background border"
                                                >
                                                    <span className="font-medium">{user.name}</span>
                                                    <span className="text-muted-foreground">({user.email})</span>
                                                    <button
                                                        onClick={() => handleRemoveUser(user._id)}
                                                        className="ml-1 w-5 h-5 rounded-full hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Share Link */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-linear-to-r from-muted/50 to-transparent border-b">
                        <CardTitle className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Link2 className="w-5 h-5 text-blue-500" />
                            </div>
                            Shareable Link
                        </CardTitle>
                        <CardDescription>Generate a secure link to share this file</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {shareLink ? (
                            <div className="space-y-4">
                                {/* Warning if access mode changed */}
                                {linkAccessMode && linkAccessMode !== settings.accessMode && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-amber-600 font-medium">Access mode changed</p>
                                            <p className="text-sm text-muted-foreground">
                                                You changed from <strong>{linkAccessMode}</strong> to <strong>{settings.accessMode}</strong>.
                                                Generate a new link to apply changes.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Input value={shareLink} readOnly className="font-mono text-sm bg-muted/50" />
                                    <Button onClick={handleCopyLink} className="gap-2 shrink-0 shadow-lg shadow-primary/20">
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {linkAccessMode === 'public' ? (
                                            <>
                                                <Globe className="w-4 h-4" />
                                                <span>Anyone with this link can access</span>
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="w-4 h-4" />
                                                <span>Only selected users can access</span>
                                            </>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateLinkButton}
                                        className="gap-2"
                                    >
                                        <Link2 className="w-4 h-4" />
                                        Regenerate
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button onClick={handleGenerateLinkButton} className="gap-2 h-12 shadow-lg shadow-primary/20">
                                <Link2 className="w-4 h-4" />
                                Generate Link
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Password Protection */}
                <Card className={`overflow-hidden transition-all duration-300 ${settings.passwordProtection ? 'ring-2 ring-primary/20' : ''}`}>
                    <CardHeader className="bg-linear-to-r from-muted/50 to-transparent border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${settings.passwordProtection ? 'bg-green-500/20' : 'bg-muted'}`}>
                                    <Lock className={`w-5 h-5 ${settings.passwordProtection ? 'text-green-500' : 'text-muted-foreground'}`} />
                                </div>
                                <div>
                                    <CardTitle>Password Protection</CardTitle>
                                    <CardDescription>Require a password to access the file</CardDescription>
                                </div>
                            </div>
                            <Button
                                variant={settings.passwordProtection ? 'default' : 'outline'}
                                onClick={() => handleChange('passwordProtection', !settings.passwordProtection)}
                                className="min-w-24"
                            >
                                {settings.passwordProtection ? 'Enabled' : 'Disabled'}
                            </Button>
                        </div>
                    </CardHeader>
                    {settings.passwordProtection && (
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Set Password</label>
                                <Input
                                    type="password"
                                    placeholder="Enter a strong password"
                                    value={settings.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    className="h-12"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Recipients will need this password to access the file
                                </p>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Expiry Settings */}
                <Card className={`overflow-hidden transition-all duration-300 ${settings.expiryEnabled ? 'ring-2 ring-primary/20' : ''}`}>
                    <CardHeader className="bg-linear-to-r from-muted/50 to-transparent border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${settings.expiryEnabled ? 'bg-amber-500/20' : 'bg-muted'}`}>
                                    <Clock className={`w-5 h-5 ${settings.expiryEnabled ? 'text-amber-500' : 'text-muted-foreground'}`} />
                                </div>
                                <div>
                                    <CardTitle>Link Expiration</CardTitle>
                                    <CardDescription>Set when this link should expire</CardDescription>
                                </div>
                            </div>
                            <Button
                                variant={settings.expiryEnabled ? 'default' : 'outline'}
                                onClick={() => handleChange('expiryEnabled', !settings.expiryEnabled)}
                                className="min-w-24"
                            >
                                {settings.expiryEnabled ? 'Enabled' : 'Disabled'}
                            </Button>
                        </div>
                    </CardHeader>
                    {settings.expiryEnabled && (
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <label className="text-sm font-medium">Link expires in</label>
                                <div className="flex flex-wrap gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Days</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={settings.expiryDays}
                                            onChange={(e) => handleChange('expiryDays', e.target.value)}
                                            className="w-24 h-12 text-center text-lg"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Hours</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="23"
                                            placeholder="0"
                                            value={settings.expiryHours}
                                            onChange={(e) => handleChange('expiryHours', e.target.value)}
                                            className="w-24 h-12 text-center text-lg"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Minutes</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="59"
                                            placeholder="0"
                                            value={settings.expiryMinutes}
                                            onChange={(e) => handleChange('expiryMinutes', e.target.value)}
                                            className="w-24 h-12 text-center text-lg"
                                        />
                                    </div>
                                </div>
                                {expiryDate ? (
                                    <div className="bg-linear-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
                                        <p className="text-sm font-medium mb-1">Link will expire on:</p>
                                        <p className="text-xl font-bold text-amber-600">
                                            {expiryDate.toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            at {expiryDate.toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Enter at least one value to set expiration
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Download Limits */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-linear-to-r from-muted/50 to-transparent border-b">
                        <CardTitle className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Download className="w-5 h-5 text-purple-500" />
                            </div>
                            Download Limits
                        </CardTitle>
                        <CardDescription>Limit the number of times this file can be downloaded</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Maximum Downloads</label>
                            <Input
                                type="number"
                                placeholder="Leave empty for unlimited"
                                value={settings.maxDownloads}
                                onChange={(e) => handleChange('maxDownloads', e.target.value)}
                                min="1"
                                className="h-12 max-w-xs"
                            />
                            <p className="text-xs text-muted-foreground">
                                The link will expire after this many downloads
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Advanced Settings */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-linear-to-r from-muted/50 to-transparent border-b">
                        <CardTitle>Advanced Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${settings.oneTimeAccess ? 'bg-destructive/10' : 'bg-muted'}`}>
                                    <Eye className={`w-6 h-6 ${settings.oneTimeAccess ? 'text-destructive' : 'text-muted-foreground'}`} />
                                </div>
                                <div>
                                    <p className="font-medium">One-Time Access</p>
                                    <p className="text-sm text-muted-foreground">
                                        {settings.accessMode === 'public'
                                            ? 'Link can only be accessed once'
                                            : 'Each user can only access once'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={settings.oneTimeAccess ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleChange('oneTimeAccess', !settings.oneTimeAccess)}
                                className="min-w-16"
                            >
                                {settings.oneTimeAccess ? 'On' : 'Off'}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${settings.trackLink ? 'bg-green-500/10' : 'bg-muted'}`}>
                                    <Shield className={`w-6 h-6 ${settings.trackLink ? 'text-green-500' : 'text-muted-foreground'}`} />
                                </div>
                                <div>
                                    <p className="font-medium">Link Tracking</p>
                                    <p className="text-sm text-muted-foreground">
                                        Track who accesses this file
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={settings.trackLink ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleChange('trackLink', !settings.trackLink)}
                                className="min-w-16"
                            >
                                {settings.trackLink ? 'On' : 'Off'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Send to Email */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-linear-to-r from-muted/50 to-transparent border-b">
                        <CardTitle className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-pink-500" />
                            </div>
                            Send via Email
                        </CardTitle>
                        <CardDescription>Share the link directly to recipients</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Recipient Emails</label>
                            <Input
                                type="text"
                                placeholder="email1@example.com, email2@example.com"
                                value={settings.recipientEmails}
                                onChange={(e) => handleChange('recipientEmails', e.target.value)}
                                className="h-12"
                            />
                            <p className="text-xs text-muted-foreground">
                                Separate multiple emails with commas
                            </p>
                        </div>
                        <Button onClick={handleSendEmail} className="gap-2 shadow-lg shadow-primary/20">
                            <Mail className="w-4 h-4" />
                            Send Email
                        </Button>
                    </CardContent>
                </Card>

                {/* Summary */}
                {shareLink && (
                    <Card className="bg-linear-to-br from-primary/10 via-primary/5 to-blue-500/10 border-primary/20 overflow-hidden">
                        <div className="h-1.5 bg-linear-to-r from-primary via-blue-500 to-purple-500"></div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                Share Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={settings.accessMode === 'public' ? 'bg-blue-500/20 text-blue-600 border-blue-500/30' : 'bg-purple-500/20 text-purple-600 border-purple-500/30'}>
                                        {settings.accessMode === 'public' ? 'Public Access' : 'Restricted Access'}
                                    </Badge>
                                    {settings.passwordProtection && (
                                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
                                            <Lock className="w-3 h-3" />
                                            Password Protected
                                        </Badge>
                                    )}
                                    {settings.expiryEnabled && expiryDate && (
                                        <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1">
                                            <Clock className="w-3 h-3" />
                                            Expires: {expiryDate.toLocaleDateString()}
                                        </Badge>
                                    )}
                                    {settings.oneTimeAccess && (
                                        <Badge className="bg-red-500/20 text-red-600 border-red-500/30 gap-1">
                                            <Eye className="w-3 h-3" />
                                            One-Time
                                        </Badge>
                                    )}
                                    {settings.maxDownloads && (
                                        <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 gap-1">
                                            <Download className="w-3 h-3" />
                                            Max {settings.maxDownloads} Downloads
                                        </Badge>
                                    )}
                                </div>
                                {settings.accessMode === 'restricted' && settings.allowedUsers.length > 0 && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Shared with {settings.allowedUsers.length} user(s): {settings.allowedUsers.map(u => u.name).join(', ')}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
