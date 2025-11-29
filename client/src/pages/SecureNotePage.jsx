import React, { useState } from 'react'
import { Link2, Lock, Eye, Save, FileText, Shield } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { noteApi } from '@/services/api'

export const SecureNotePage = () => {
    const [note, setNote] = useState('')
    const [title, setTitle] = useState('')
    const [encrypted, setEncrypted] = useState(true)
    const [autoDelete, setAutoDelete] = useState(false)
    const [shareLink, setShareLink] = useState('')
    const [noteId, setNoteId] = useState(null)
    const toast = useToast()

    const createNote = async () => {
        if (!title || !note) {
            toast.error('Please enter a title and note')
            return null
        }

        try {
            // In a real app, encrypt content here before sending
            const payload = {
                contentEncrypted: note, // TODO: Implement client-side encryption
                iv: 'dummy-iv-' + Date.now(),
                maxViews: autoDelete ? 1 : 100,
                expiresAt: null // TODO: Add expiration picker
            }

            const { data } = await noteApi.create(payload)
            setNoteId(data.id)
            toast.success('Secure note saved!')
            return data.id
        } catch (error) {
            console.error('Failed to create note:', error)
            toast.error('Failed to save note')
            return null
        }
    }

    const handleSave = async () => {
        await createNote()
    }

    const handleGenerateLink = async () => {
        let currentNoteId = noteId
        if (!currentNoteId) {
            currentNoteId = await createNote()
        }

        if (currentNoteId) {
            const link = `${window.location.origin}/note/${currentNoteId}`
            setShareLink(link)
            toast.success('Share link generated!')
        }
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink)
        toast.success('Link copied to clipboard!')
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 max-w-4xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Secure Note</h1>
                    <p className="text-muted-foreground">
                        Create and share encrypted notes securely
                    </p>
                </div>

                {/* Settings */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Shield className={`w-5 h-5 ${encrypted ? 'text-green-500' : 'text-orange-500'}`} />
                                    <div>
                                        <p className="font-medium">Encryption</p>
                                        <p className="text-sm text-muted-foreground">
                                            {encrypted ? 'Note will be encrypted' : 'Encryption disabled'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant={encrypted ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setEncrypted(!encrypted)}
                                >
                                    {encrypted ? 'On' : 'Off'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Eye className="w-5 h-5 text-destructive" />
                                    <div>
                                        <p className="font-medium">Auto-Delete After Read</p>
                                        <p className="text-sm text-muted-foreground">
                                            {autoDelete ? 'Note will be deleted' : 'Note persists'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant={autoDelete ? 'destructive' : 'outline'}
                                    size="sm"
                                    onClick={() => setAutoDelete(!autoDelete)}
                                >
                                    {autoDelete ? 'On' : 'Off'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Note Editor */}
                <Card>
                    <CardHeader>
                        <CardTitle>Note Content</CardTitle>
                        <CardDescription>Enter your secure note below</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                placeholder="Note title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={!!noteId}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Note</label>
                            <textarea
                                className="w-full min-h-[300px] p-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Write your secure note here..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                disabled={!!noteId}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleSave} className="gap-2" disabled={!!noteId}>
                                <Save className="w-4 h-4" />
                                {noteId ? 'Saved' : 'Save Note'}
                            </Button>
                            <Button onClick={handleGenerateLink} variant="outline" className="gap-2">
                                <Link2 className="w-4 h-4" />
                                Generate Share Link
                            </Button>
                            {noteId && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setNoteId(null)
                                        setShareLink('')
                                        setTitle('')
                                        setNote('')
                                    }}
                                >
                                    New Note
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Share Link */}
                {shareLink && (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle>Share Link</CardTitle>
                            <CardDescription>Share this link to give access to your note</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input value={shareLink} readOnly className="font-mono text-sm" />
                                <Button onClick={handleCopyLink}>Copy</Button>
                            </div>

                            <div className="flex gap-2">
                                {encrypted && <Badge variant="success">Encrypted</Badge>}
                                {autoDelete && <Badge variant="destructive">Auto-Delete Enabled</Badge>}
                            </div>

                            <p className="text-sm text-muted-foreground">
                                ⚠️ This link will give anyone access to your note. Share it securely.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
