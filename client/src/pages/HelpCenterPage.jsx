import React, { useState } from 'react'
import { HelpCircle, Shield, Lock, Share2, FileText, Mail, ChevronDown, Search, Sparkles, MessageCircle, ExternalLink, CheckCircle2 } from 'lucide-react'
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

    const filteredFaqs = faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
            faq => searchQuery === '' ||
                faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0)

    return (
        <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
            <div className="container mx-auto p-6 max-w-6xl space-y-8">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto space-y-6">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                        <div className="relative w-20 h-20 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                            <HelpCircle className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
                            Help Center
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Find answers to common questions and learn best practices for secure file sharing
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-xl mx-auto group">
                        <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-blue-500/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <div className="relative">
                            <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search for help articles, FAQs, or topics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-14 text-lg bg-background/80 backdrop-blur-sm border-2 focus:border-primary/50"
                            />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                        {['Encryption', 'Sharing', 'Password', '2FA', 'Privacy'].map((topic) => (
                            <Button
                                key={topic}
                                variant="outline"
                                size="sm"
                                className="rounded-full hover:bg-primary/10 hover:border-primary/50 transition-all"
                                onClick={() => setSearchQuery(topic)}
                            >
                                {topic}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
                            <p className="text-sm text-muted-foreground">
                                {filteredFaqs.reduce((acc, cat) => acc + cat.questions.length, 0)} articles found
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredFaqs.length > 0 ? filteredFaqs.map((category) => (
                            <Card key={category.category} className="group overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                                <CardHeader className="bg-linear-to-r from-muted/50 to-transparent border-b">
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <category.icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <span>{category.category}</span>
                                        <Badge variant="secondary" className="ml-auto">{category.questions.length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {category.questions.map((faq, index) => {
                                        const key = `${category.category}-${index}`
                                        const isExpanded = expandedFaq === key

                                        return (
                                            <div key={index} className="border-b last:border-0">
                                                <button
                                                    onClick={() => toggleFaq(category.category, index)}
                                                    className="w-full p-5 text-left flex items-center justify-between hover:bg-accent/50 transition-all group/item"
                                                >
                                                    <span className="font-medium pr-4 group-hover/item:text-primary transition-colors">{faq.q}</span>
                                                    <ChevronDown className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
                                                </button>
                                                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 pb-5' : 'max-h-0'}`}>
                                                    <div className="px-5 text-muted-foreground leading-relaxed border-l-4 border-primary/30 ml-5 pl-4">
                                                        {faq.a}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>
                        )) : (
                            <Card className="p-12 text-center">
                                <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium mb-2">No results found</h3>
                                <p className="text-muted-foreground">Try searching with different keywords</p>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Security Best Practices */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold">Security Best Practices</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {bestPractices.map((practice, index) => (
                            <Card key={index} className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                <CardHeader className="relative">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-primary/10 to-transparent rounded-full blur-2xl"></div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <practice.icon className="w-7 h-7 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg mb-2">{practice.title}</CardTitle>
                                            <CardDescription className="leading-relaxed">{practice.description}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center text-sm text-primary hover:underline cursor-pointer group/link">
                                        <span>Learn more</span>
                                        <ExternalLink className="w-3 h-3 ml-1 group-hover/link:translate-x-1 transition-transform" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Contact Support */}
                <Card className="bg-linear-to-br from-primary/10 via-primary/5 to-blue-500/10 border-primary/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <CardHeader className="relative">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                                <Mail className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    Contact Support
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Can't find what you're looking for? Our support team is here to help.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 relative">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50 backdrop-blur-sm border">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Email Support</p>
                                    <p className="text-sm text-muted-foreground">support@securetransfer.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50 backdrop-blur-sm border">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Response Time</p>
                                    <p className="text-sm text-muted-foreground">Within 24 hours</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50 backdrop-blur-sm border">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Live Chat</p>
                                    <p className="text-sm text-muted-foreground">Coming soon</p>
                                </div>
                            </div>
                        </div>
                        <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                            <Mail className="w-4 h-4" />
                            Send Us a Message
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
