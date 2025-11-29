import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Mail, Lock, Clock, Smartphone, Loader2, ArrowRight, KeyRound } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        twoFactorCode: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
    const otpRefs = useRef([])
    const { login, isAuthenticated } = useAuth()
    const toast = useToast()
    const navigate = useNavigate()
    const sessionTimeout = 30

    useEffect(() => {
        if (isAuthenticated) {
            const returnUrl = localStorage.getItem('returnUrl')
            if (returnUrl) {
                localStorage.removeItem('returnUrl')
                navigate(returnUrl)
            }
        }
    }, [isAuthenticated, navigate])

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return

        const newDigits = [...otpDigits]
        newDigits[index] = value.slice(-1)
        setOtpDigits(newDigits)
        setFormData({ ...formData, twoFactorCode: newDigits.join('') })

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    const handleOtpPaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        const newDigits = [...otpDigits]
        pastedData.split('').forEach((char, i) => {
            if (i < 6) newDigits[i] = char
        })
        setOtpDigits(newDigits)
        setFormData({ ...formData, twoFactorCode: newDigits.join('') })
        if (pastedData.length === 6) {
            otpRefs.current[5]?.focus()
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.email || !formData.password) {
            toast.error('Please fill in all fields')
            return
        }

        if (requiresTwoFactor && formData.twoFactorCode.length !== 6) {
            toast.error('Please enter your 6-digit authentication code')
            return
        }

        setIsLoading(true)

        try {
            const result = await login({
                email: formData.email,
                password: formData.password,
                twoFactorCode: formData.twoFactorCode || undefined
            })

            if (result?.requiresTwoFactor) {
                setRequiresTwoFactor(true)
                toast.info('Please enter your two-factor authentication code')
                setIsLoading(false)
                setTimeout(() => otpRefs.current[0]?.focus(), 100)
                return
            }

            toast.success('Welcome back!')

            const returnUrl = localStorage.getItem('returnUrl')
            if (returnUrl) {
                localStorage.removeItem('returnUrl')
                navigate(returnUrl)
            } else {
                navigate('/dashboard')
            }
        } catch (error) {
            if (error.response?.data?.requiresTwoFactor) {
                setRequiresTwoFactor(true)
                toast.info('Please enter your two-factor authentication code')
                setTimeout(() => otpRefs.current[0]?.focus(), 100)
            } else {
                toast.error(error.response?.data?.message || 'Invalid credentials')
                if (requiresTwoFactor) {
                    setOtpDigits(['', '', '', '', '', ''])
                    setFormData(prev => ({ ...prev, twoFactorCode: '' }))
                }
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleBackToLogin = () => {
        setRequiresTwoFactor(false)
        setOtpDigits(['', '', '', '', '', ''])
        setFormData(prev => ({ ...prev, twoFactorCode: '' }))
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/5 via-background to-secondary/5 p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

            <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 shadow-2xl border-primary/10">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-6">
                        <div className={`w-20 h-20 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center transform transition-all duration-500 ${requiresTwoFactor ? 'rotate-12' : ''}`}>
                            {requiresTwoFactor ? (
                                <KeyRound className="w-10 h-10 text-primary" />
                            ) : (
                                <Shield className="w-10 h-10 text-primary" />
                            )}
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold">
                        {requiresTwoFactor ? 'Verify Identity' : 'Welcome Back'}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        {requiresTwoFactor
                            ? 'Enter the code from your authenticator app'
                            : 'Sign in to your secure vault'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!requiresTwoFactor ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            type="email"
                                            name="email"
                                            placeholder="you@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="pl-11 h-12 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/50"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="pl-11 pr-11 h-12 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/50"
                                            required
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" className="rounded border-muted-foreground/30" />
                                        <span className="text-muted-foreground">Remember me</span>
                                    </label>
                                    <a href="#" className="text-sm text-primary hover:underline font-medium">
                                        Forgot password?
                                    </a>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-center gap-2">
                                    {otpDigits.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={el => otpRefs.current[index] = el}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            onPaste={handleOtpPaste}
                                            className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-muted bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            disabled={isLoading}
                                        />
                                    ))}
                                </div>

                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">
                                        <Smartphone className="inline w-4 h-4 mr-1" />
                                        Open your authenticator app to view your code
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleBackToLogin}
                                    className="text-sm text-primary hover:underline w-full text-center font-medium"
                                    disabled={isLoading}
                                >
                                    ← Back to login
                                </button>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold gap-2 group"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Please wait...
                                </>
                            ) : requiresTwoFactor ? (
                                <>
                                    Verify & Sign In
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col gap-5 pt-2">
                    {!requiresTwoFactor && (
                        <div className="text-sm text-center text-muted-foreground">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary hover:underline font-semibold">
                                Create account
                            </Link>
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{sessionTimeout}min timeout</span>
                        </div>
                        <span className="text-muted-foreground/30">•</span>
                        <div className="flex items-center gap-1.5">
                            <Shield className="w-4 h-4" />
                            <span>256-bit encryption</span>
                        </div>
                    </div>

                    <Badge variant="secondary" className="mx-auto px-4 py-1.5">
                        🔒 Zero-knowledge encryption enabled
                    </Badge>
                </CardFooter>
            </Card>
        </div>
    )
}
