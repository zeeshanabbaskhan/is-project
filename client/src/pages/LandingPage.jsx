import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Lock, Users, Zap, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export const LandingPage = () => {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-secondary/10 py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <Badge className="mb-4" variant="secondary">
                            🔒 Enterprise-Grade Security
                        </Badge>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Secure File Transfer
                            <span className="block text-primary">Made Simple</span>
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Share files with confidence using end-to-end encryption,
                            password protection, and advanced privacy features.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link to="/signup">
                                <Button size="lg" className="gap-2">
                                    Get Started Free
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline">
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <Card>
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <span className="text-2xl font-bold text-primary">1</span>
                                </div>
                                <CardTitle>Upload Your Files</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Drag and drop files or select them. Files are encrypted on your device before upload.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <span className="text-2xl font-bold text-primary">2</span>
                                </div>
                                <CardTitle>Set Permissions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Add password protection, expiry dates, and download limits for maximum control.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <span className="text-2xl font-bold text-primary">3</span>
                                </div>
                                <CardTitle>Share Securely</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Generate secure links and track who accesses your files with detailed analytics.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Security Banner */}
            <section className="py-12 bg-destructive/10 border-y border-destructive/20">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Shield className="w-8 h-8 text-destructive" />
                            <div>
                                <h3 className="font-semibold">Data Breach Awareness</h3>
                                <p className="text-sm text-muted-foreground">
                                    Over 5 billion records compromised in 2024. Protect your data today.
                                </p>
                            </div>
                        </div>
                        <Link to="/signup">
                            <Button variant="destructive">
                                Secure Your Files Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">Advanced Security Features</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={<Lock className="w-6 h-6" />}
                            title="End-to-End Encryption"
                            description="Files encrypted on your device before upload"
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6" />}
                            title="Zero-Knowledge"
                            description="We can't see your files, only you can"
                        />
                        <FeatureCard
                            icon={<Users className="w-6 h-6" />}
                            title="Secure Sharing"
                            description="Password protection and expiry dates"
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6" />}
                            title="Smart Detection"
                            description="Auto-detect sensitive content"
                        />
                        <FeatureCard
                            icon={<CheckCircle className="w-6 h-6" />}
                            title="Version History"
                            description="Track and restore previous versions"
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6" />}
                            title="Device Management"
                            description="Monitor and control access devices"
                        />
                        <FeatureCard
                            icon={<Lock className="w-6 h-6" />}
                            title="Privacy Mode"
                            description="Blur sensitive content on screen"
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6" />}
                            title="Access Analytics"
                            description="Detailed insights on file access"
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 font-bold text-lg mb-4">
                                <Shield className="w-5 h-5 text-primary" />
                                SecureTransfer
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Enterprise-grade secure file transfer for everyone.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-foreground">Features</a></li>
                                <li><a href="#" className="hover:text-foreground">Security</a></li>
                                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Resources</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link to="/help" className="hover:text-foreground">Help Center</Link></li>
                                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                                <li><a href="#" className="hover:text-foreground">API</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-foreground">Security</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                        © 2025 SecureTransfer. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
}

const FeatureCard = ({ icon, title, description }) => (
    <Card className="text-center">
        <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                {icon}
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
)
