import React, { useState } from 'react'
import { HelpCircle, Shield, Lock, Share2, FileText, Mail, ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const faqs = [
    {
        category: 'Getting Started',
        icon: HelpCircle,
        questions: [
            {
                q: 'How do I upload files?',
                a: 'Navigate to the Upload page from the navigation bar, then either drag and drop files or click to browse. Files are automatically encrypted before upload.'
            },
            {
                q: 'What file types are supported?',
                a: 'All file types are supported. There is a maximum file size limit of 100MB per file.'
            }
        ]
    },
    {
        category: 'Security',
        icon: Shield,
        questions: [
            {
                q: 'How are my files encrypted?',
                a: 'Files are encrypted using AES-256 encryption on your device before being uploaded. We use zero-knowledge architecture, meaning we cannot access your files.'
            },
            {
                q: 'What is zero-knowledge encryption?',
                a: 'Zero-knowledge means that only you can decrypt and view your files. Even our servers cannot access the content of your encrypted files.'
            },
            {
                q: 'Can I password protect shared links?',
                a: 'Yes! When sharing files, you can enable password protection, set expiry dates, and limit the number of downloads.'
            }
        ]
    },
    {
        category: 'Sharing',
        icon: Share2,
        questions: [
            {
                q: 'How do I share files?',
                a: 'Click on any file and select the "Share" option. You can then generate a secure link with custom settings like password protection and expiry dates.'
            },
            {
                q: 'Can I track who accessed my files?',
                a: 'Yes! Enable link tracking when sharing files to see detailed analytics including views, downloads, geographic location, and access times.'
            },
            {
                q: 'How do I set an expiry date?',
                a: 'In the share settings, enable "Link Expiration" and select your desired date and time. The link will automatically expire after that point.'
            }
        ]
    }
]

const bestPractices = [
    {
        title: 'Use Strong Passwords',
        description: 'Create unique passwords with a mix of letters, numbers, and symbols. Use our password strength meter as a guide.',
        icon: Lock
    },
    {
        title: 'Enable Two-Factor Authentication',
        description: 'Add an extra layer of security by enabling 2FA in your account settings.',
        icon: Shield
    },
    {
        title: 'Review Shared Links Regularly',
        description: 'Periodically check your shared links and revoke access to expired or unnecessary shares.',
        icon: Share2
    },
    {
        title: 'Monitor Device Access',
        description: 'Check the Device Management page regularly to ensure only your devices have access.',
        icon: FileText
    }
]

export const HelpCenterPage = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedFaq, setExpandedFaq] = useState(null)

    const toggleFaq = (category, index) => {
        const key = `${category}-${index}`
        setExpandedFaq(expandedFaq === key ? null : key)
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 max-w-6xl space-y-6">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Help Center</h1>
                    <p className="text-muted-foreground mb-6">
                        Find answers to common questions and learn best practices for secure file sharing
                    </p>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search for help..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12"
                        />
                    </div>
                </div>

                {/* FAQ Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        {faqs.map((category) => (
                            <Card key={category.category}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <category.icon className="w-5 h-5" />
                                        {category.category}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {category.questions.map((faq, index) => {
                                        const key = `${category.category}-${index}`
                                        const isExpanded = expandedFaq === key

                                        return (
                                            <div key={index} className="border rounded-lg">
                                                <button
                                                    onClick={() => toggleFaq(category.category, index)}
                                                    className="w-full p-4 text-left flex items-center justify-between hover:bg-accent/50 transition-colors rounded-lg"
                                                >
                                                    <span className="font-medium">{faq.q}</span>
                                                    <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isExpanded && (
                                                    <div className="p-4 pt-0 text-muted-foreground">
                                                        {faq.a}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Security Best Practices */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">Security Best Practices</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {bestPractices.map((practice, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                        <practice.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-lg">{practice.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{practice.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Contact Support */}
                <Card className="bg-linear-to-br from-primary/10 to-blue-500/10 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Contact Support
                        </CardTitle>
                        <CardDescription>
                            Can't find what you're looking for? Our support team is here to help.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium mb-1">Email Support</p>
                                <p className="text-sm text-muted-foreground">support@securetransfer.com</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-1">Response Time</p>
                                <p className="text-sm text-muted-foreground">Within 24 hours</p>
                            </div>
                        </div>
                        <Button className="gap-2">
                            <Mail className="w-4 h-4" />
                            Send Us a Message
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
