import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Lock, Users, Zap, CheckCircle, ArrowRight, Sparkles, Globe, FileText, Eye, Fingerprint, Server, Cloud, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export const LandingPage = () => {
    return (
        <div className="min-h-screen overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center bg-linear-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 py-20 relative z-10">
                    <div className="max-w-5xl mx-auto text-center">
                        <Badge className="mb-6 px-4 py-2 text-sm font-medium" variant="secondary">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Enterprise-Grade Security for Everyone
                        </Badge>

                        <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                            Secure File Transfer
                            <span className="block bg-linear-to-r from-primary via-blue-500 to-secondary bg-clip-text text-transparent">
                                Made Simple
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                            Share files with confidence using end-to-end encryption,
                            password protection, and advanced privacy features. Your data, your control.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                            <Link to="/signup">
                                <Button size="lg" className="h-14 px-8 text-lg gap-3 group shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                                    Sign In
                                </Button>
                            </Link>
                        </div>

                        {/* Trust indicators */}
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>5GB free storage</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>256-bit encryption</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-8 h-12 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
                        <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-muted/30 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4">How It Works</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Three Simple Steps</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Start protecting your files in under a minute
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { step: 1, title: 'Upload Your Files', description: 'Drag and drop files or select them. Files are encrypted on your device before upload.', icon: Cloud },
                            { step: 2, title: 'Set Permissions', description: 'Add password protection, expiry dates, and download limits for maximum control.', icon: Lock },
                            { step: 3, title: 'Share Securely', description: 'Generate secure links and track who accesses your files with detailed analytics.', icon: Globe }
                        ].map((item, index) => (
                            <Card key={index} className="relative group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-secondary"></div>
                                <CardHeader className="pt-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <item.icon className="w-7 h-7 text-primary" />
                                        </div>
                                        <span className="text-5xl font-bold text-muted-foreground/20">{item.step}</span>
                                    </div>
                                    <CardTitle className="text-xl">{item.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{item.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security Banner */}
            <section className="py-16 bg-destructive/5 border-y border-destructive/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(239,68,68,0.1),transparent_50%)]"></div>
                <div className="container mx-auto px-4 relative">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                                <Shield className="w-8 h-8 text-destructive" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Data Breach Awareness</h3>
                                <p className="text-muted-foreground">
                                    Over 5 billion records compromised in 2024. Protect your data today.
                                </p>
                            </div>
                        </div>
                        <Link to="/signup">
                            <Button variant="destructive" size="lg" className="gap-2 shadow-lg">
                                Secure Your Files Now
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4">Features</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Advanced Security Features</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Everything you need to keep your files safe and private
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {[
                            { icon: Lock, title: 'End-to-End Encryption', description: 'Files encrypted on your device before upload', color: 'text-blue-500 bg-blue-500/10' },
                            { icon: Eye, title: 'Zero-Knowledge', description: "We can't see your files, only you can", color: 'text-purple-500 bg-purple-500/10' },
                            { icon: Users, title: 'Secure Sharing', description: 'Password protection and expiry dates', color: 'text-green-500 bg-green-500/10' },
                            { icon: Zap, title: 'Smart Detection', description: 'Auto-detect sensitive content', color: 'text-orange-500 bg-orange-500/10' },
                            { icon: FileText, title: 'Version History', description: 'Track and restore previous versions', color: 'text-cyan-500 bg-cyan-500/10' },
                            { icon: Fingerprint, title: 'Device Management', description: 'Monitor and control access devices', color: 'text-pink-500 bg-pink-500/10' },
                            { icon: Shield, title: 'Privacy Mode', description: 'Blur sensitive content on screen', color: 'text-indigo-500 bg-indigo-500/10' },
                            { icon: Server, title: 'Access Analytics', description: 'Detailed insights on file access', color: 'text-teal-500 bg-teal-500/10' },
                        ].map((feature, index) => (
                            <Card key={index} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center border-0 bg-muted/30">
                                <CardHeader className="pb-2">
                                    <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                        <feature.icon className="w-7 h-7" />
                                    </div>
                                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-linear-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
                </div>
                <div className="container mx-auto px-4 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Secure Your Files?</h2>
                        <p className="text-xl text-muted-foreground mb-10">
                            Join thousands of users who trust SecureVault for their sensitive documents.
                        </p>
                        <Link to="/signup">
                            <Button size="lg" className="h-14 px-10 text-lg gap-3 group shadow-lg">
                                Start for Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-2 font-bold text-xl mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-primary" />
                                </div>
                                SecureVault
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Enterprise-grade secure file transfer for everyone.
                            </p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                ))}
                                <span className="text-sm text-muted-foreground ml-2">4.9/5</span>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Enterprise</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Resources</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><Link to="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">GDPR</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                        <p>© 2025 SecureVault. All rights reserved.</p>
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span>SOC 2 Type II Certified</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
