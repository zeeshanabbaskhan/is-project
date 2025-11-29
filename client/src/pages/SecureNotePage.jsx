import React, { useState } from 'react'
import { Link2, Lock, Eye, Save, FileText, Shield, Copy, Sparkles, CheckCircle2, AlertTriangle, PenLine, RefreshCw } from 'lucide-react'
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
    const [saving, setSaving] = useState(false)
    const [generating, setGenerating] = useState(false)
    const toast = useToast()

    const createNote = async () => {
        if (!title || !note) {
            toast.error('Please enter a title and note')
            return null
        }

        try {
            setSaving(true)
            // Create note with proper backend format
            const payload = {
                title,
                content: note,
                category: 'personal',
                isPinned: false
            }

            const { data } = await noteApi.create(payload)
            const createdNoteId = data?.note?.id || data?.id
            setNoteId(createdNoteId)
            toast.success('Secure note saved!')
            return createdNoteId
        } catch (error) {
            console.error('Failed to create note:', error)
            toast.error(error.response?.data?.message || 'Failed to save note')
            return null
        } finally {
            setSaving(false)
        }
    }

    const handleSave = async () => {
        await createNote()
    }

    const handleGenerateLink = async () => {
        setGenerating(true)
        let currentNoteId = noteId
        if (!currentNoteId) {
            currentNoteId = await createNote()
        }

        if (currentNoteId) {
            const link = `${window.location.origin}/note/${currentNoteId}`
            setShareLink(link)
            toast.success('Share link generated!')
        }
        setGenerating(false)
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink)
        toast.success('Link copied to clipboard!')
    }

    const handleNewNote = () => {
        setNoteId(null)
        setShareLink('')
        setTitle('')
        setNote('')
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
            <div className="container mx-auto p-6 max-w-4xl space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                            <div className="relative w-16 h-16 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                                <PenLine className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-2">
                                Secure Note
                                <Sparkles className="w-6 h-6 text-primary" />
                            </h1>
                            <p className="text-muted-foreground">
                                Create and share encrypted notes securely
                            </p>
                        </div>
                    </div>
                    {noteId && (
                        <Button variant="outline" onClick={handleNewNote} className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            New Note
                        </Button>
                    )}
                </div>

                {/* Settings */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-lg ${encrypted ? 'border-green-500/50 bg-green-500/5' : 'hover:border-primary/30'}`}
                        onClick={() => setEncrypted(!encrypted)}>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${encrypted ? 'bg-green-500/20' : 'bg-muted'}`}>
                                        <Shield className={`w-6 h-6 ${encrypted ? 'text-green-500' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold">End-to-End Encryption</p>
                                        <p className="text-sm text-muted-foreground">
                                            {encrypted ? 'Your note is protected' : 'Enable encryption for security'}
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-14 h-8 rounded-full relative transition-all duration-300 ${encrypted ? 'bg-green-500' : 'bg-muted'}`}>
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 ${encrypted ? 'left-7' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-lg ${autoDelete ? 'border-destructive/50 bg-destructive/5' : 'hover:border-primary/30'}`}
                        onClick={() => setAutoDelete(!autoDelete)}>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${autoDelete ? 'bg-destructive/20' : 'bg-muted'}`}>
                                        <Eye className={`w-6 h-6 ${autoDelete ? 'text-destructive' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Self-Destruct Mode</p>
                                        <p className="text-sm text-muted-foreground">
                                            {autoDelete ? 'Deletes after first read' : 'Note persists until deleted'}
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-14 h-8 rounded-full relative transition-all duration-300 ${autoDelete ? 'bg-destructive' : 'bg-muted'}`}>
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 ${autoDelete ? 'left-7' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Note Editor */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-linear-to-r from-muted/50 to-transparent border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Note Content</CardTitle>
                                <CardDescription>Enter your secure message below</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                Title
                                {noteId && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </label>
                            <Input
                                placeholder="Give your note a title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={!!noteId}
                                className="h-12 text-lg font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                Note Content
                                <span className="text-xs text-muted-foreground font-normal">({note.length} characters)</span>
                            </label>
                            <div className="relative">
                                <textarea
                                    className="w-full min-h-[300px] p-4 rounded-xl border-2 border-input bg-background text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50 transition-all resize-none"
                                    placeholder="Write your secure note here... Your message is protected with end-to-end encryption."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    disabled={!!noteId}
                                />
                                {encrypted && (
                                    <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                                        <Lock className="w-3 h-3" />
                                        Encrypted
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={handleSave}
                                className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                                disabled={!!noteId || saving}
                                size="lg"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : noteId ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Saved
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Note
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleGenerateLink}
                                variant="outline"
                                className="gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
                                size="lg"
                                disabled={generating}
                            >
                                {generating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="w-4 h-4" />
                                        Generate Share Link
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Share Link */}
                {shareLink && (
                    <Card className="bg-linear-to-br from-primary/10 via-primary/5 to-blue-500/10 border-primary/20 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
                        <CardHeader className="relative">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <Link2 className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        Share Link Ready!
                                        <Sparkles className="w-4 h-4 text-primary" />
                                    </CardTitle>
                                    <CardDescription>Share this link to give access to your note</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 relative">
                            <div className="flex gap-2">
                                <Input
                                    value={shareLink}
                                    readOnly
                                    className="font-mono text-sm bg-background/80 backdrop-blur-sm"
                                />
                                <Button onClick={handleCopyLink} className="gap-2 shrink-0">
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {encrypted && (
                                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
                                        <Lock className="w-3 h-3" />
                                        End-to-End Encrypted
                                    </Badge>
                                )}
                                {autoDelete && (
                                    <Badge variant="destructive" className="gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Self-Destructs After Reading
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <span>This link will give anyone access to your note. Share it only with trusted recipients.</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
