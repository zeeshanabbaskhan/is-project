import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Link2, Copy, Mail, Lock, Clock, Download, Eye, Shield, Calendar, Users } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { shareApi } from '@/services/api'

export const ShareSettingsPage = () => {
    const { id } = useParams()
    const toast = useToast()
    const navigate = useNavigate()

    const [settings, setSettings] = useState({
        passwordProtection: false,
        password: '',
        expiryEnabled: false,
        expiryDate: '',
        expiryTime: '23:59',
        maxDownloads: '',
        oneTimeAccess: false,
        trackLink: true,
        recipientEmails: ''
    })

    const [shareLink, setShareLink] = useState('')

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }))
    }

    const handleGenerateLink = async () => {
        try {
            let expiresAt = null
            if (settings.expiryEnabled && settings.expiryDate) {
                expiresAt = new Date(`${settings.expiryDate}T${settings.expiryTime || '23:59'}`)
            }

            const payload = {
                fileId: id,
                expiresAt,
                maxDownloads: settings.maxDownloads ? parseInt(settings.maxDownloads) : null,
                passwordHash: settings.passwordProtection ? settings.password : null // In real app, hash this
            }

            const { data } = await shareApi.create(payload)
            const link = `${window.location.origin}/share/public/${data.token}`
            setShareLink(link)
            toast.success('Share link generated!')
        } catch (error) {
            console.error('Failed to generate link:', error)
            toast.error('Failed to generate link')
        }
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink)
        toast.success('Link copied to clipboard!')
    }

    const handleSendEmail = () => {
        if (!settings.recipientEmails) {
            toast.error('Please enter recipient email addresses')
            return
        }
        // In a real app, call an API to send email
        toast.success('Share link sent via email!')
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 max-w-4xl space-y-6">
                <div>
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                        ← Back
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">Share Settings</h1>
                    <p className="text-muted-foreground">
                        Configure security settings for sharing this file
                    </p>
                </div>

                {/* Share Link */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="w-5 h-5" />
                            Shareable Link
                        </CardTitle>
                        <CardDescription>Generate a secure link to share this file</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {shareLink ? (
                            <div className="flex gap-2">
                                <Input value={shareLink} readOnly className="font-mono text-sm" />
                                <Button onClick={handleCopyLink} className="gap-2">
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={handleGenerateLink} className="gap-2">
                                <Link2 className="w-4 h-4" />
                                Generate Link
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Password Protection */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="w-5 h-5" />
                                    Password Protection
                                </CardTitle>
                                <CardDescription>Require a password to access the file</CardDescription>
                            </div>
                            <Button
                                variant={settings.passwordProtection ? 'default' : 'outline'}
                                onClick={() => handleChange('passwordProtection', !settings.passwordProtection)}
                            >
                                {settings.passwordProtection ? 'Enabled' : 'Disabled'}
                            </Button>
                        </div>
                    </CardHeader>
                    {settings.passwordProtection && (
                        <CardContent>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Set Password</label>
                                <Input
                                    type="password"
                                    placeholder="Enter password"
                                    value={settings.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Recipients will need this password to access the file
                                </p>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Expiry Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Link Expiration
                                </CardTitle>
                                <CardDescription>Set when this link should expire</CardDescription>
                            </div>
                            <Button
                                variant={settings.expiryEnabled ? 'default' : 'outline'}
                                onClick={() => handleChange('expiryEnabled', !settings.expiryEnabled)}
                            >
                                {settings.expiryEnabled ? 'Enabled' : 'Disabled'}
                            </Button>
                        </div>
                    </CardHeader>
                    {settings.expiryEnabled && (
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Expiry Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            value={settings.expiryDate}
                                            onChange={(e) => handleChange('expiryDate', e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Expiry Time</label>
                                    <Input
                                        type="time"
                                        value={settings.expiryTime}
                                        onChange={(e) => handleChange('expiryTime', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Download Limits */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            Download Limits
                        </CardTitle>
                        <CardDescription>Limit the number of times this file can be downloaded</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Maximum Downloads</label>
                            <Input
                                type="number"
                                placeholder="Leave empty for unlimited"
                                value={settings.maxDownloads}
                                onChange={(e) => handleChange('maxDownloads', e.target.value)}
                                min="1"
                            />
                            <p className="text-xs text-muted-foreground">
                                The link will expire after this many downloads
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Advanced Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Advanced Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <Eye className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">One-Time Access</p>
                                    <p className="text-sm text-muted-foreground">
                                        Link expires after first view
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={settings.oneTimeAccess ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleChange('oneTimeAccess', !settings.oneTimeAccess)}
                            >
                                {settings.oneTimeAccess ? 'On' : 'Off'}
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-muted-foreground" />
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
                            >
                                {settings.trackLink ? 'On' : 'Off'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Send to Email */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Send via Email
                        </CardTitle>
                        <CardDescription>Share the link directly to recipients</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Recipient Emails</label>
                            <Input
                                type="text"
                                placeholder="email1@example.com, email2@example.com"
                                value={settings.recipientEmails}
                                onChange={(e) => handleChange('recipientEmails', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Separate multiple emails with commas
                            </p>
                        </div>
                        <Button onClick={handleSendEmail} className="gap-2">
                            <Mail className="w-4 h-4" />
                            Send Email
                        </Button>
                    </CardContent>
                </Card>

                {/* Summary */}
                {shareLink && (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle>Share Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {settings.passwordProtection && (
                                        <Badge variant="success">Password Protected</Badge>
                                    )}
                                    {settings.expiryEnabled && (
                                        <Badge variant="warning">Expires: {settings.expiryDate}</Badge>
                                    )}
                                    {settings.oneTimeAccess && (
                                        <Badge variant="info">One-Time Access</Badge>
                                    )}
                                    {settings.maxDownloads && (
                                        <Badge variant="secondary">Max {settings.maxDownloads} Downloads</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    This link is configured with the security settings shown above
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
