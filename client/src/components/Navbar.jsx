import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Moon, Sun, Shield, Menu, Bell, Settings, Upload, Inbox, Home, HelpCircle, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const Navbar = () => {
    const { theme, toggleTheme } = useTheme()
    const { privacyMode, togglePrivacyMode } = usePrivacy()
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    if (!user) return null

    return (
        <nav className="border-b bg-card">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
                            <Shield className="w-6 h-6 text-primary" />
                            <span>SecureTransfer</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-4">
                            <Link to="/dashboard">
                                <Button variant="ghost" size="sm">
                                    <Home className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link to="/upload">
                                <Button variant="ghost" size="sm">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload
                                </Button>
                            </Link>
                            <Link to="/inbox">
                                <Button variant="ghost" size="sm">
                                    <Inbox className="w-4 h-4 mr-2" />
                                    Inbox
                                    <Badge variant="destructive" className="ml-2">3</Badge>
                                </Button>
                            </Link>
                            <Link to="/devices">
                                <Button variant="ghost" size="sm">
                                    <Monitor className="w-4 h-4 mr-2" />
                                    Devices
                                </Button>
                            </Link>
                            <Link to="/help">
                                <Button variant="ghost" size="sm">
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    Help
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={toggleTheme}>
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </Button>

                        <Button
                            variant={privacyMode ? "default" : "ghost"}
                            size="icon"
                            onClick={togglePrivacyMode}
                            title="Privacy Screen Mode"
                        >
                            <Shield className="w-5 h-5" />
                        </Button>

                        <Button variant="ghost" size="icon">
                            <Bell className="w-5 h-5" />
                        </Button>

                        <Link to="/settings">
                            <Button variant="ghost" size="icon">
                                <Settings className="w-5 h-5" />
                            </Button>
                        </Link>

                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
