import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Mail, Lock, User, Loader2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { calculatePasswordStrength } from '@/lib/utils'

export const SignupPage = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { signup } = useAuth()
    const toast = useToast()
    const navigate = useNavigate()

    const passwordStrength = calculatePasswordStrength(formData.password)

    const passwordChecks = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'Contains uppercase', met: /[A-Z]/.test(formData.password) },
        { label: 'Contains lowercase', met: /[a-z]/.test(formData.password) },
        { label: 'Contains number', met: /\d/.test(formData.password) },
    ]

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (passwordStrength.score < 3) {
            toast.warning('Please use a stronger password')
            return
        }

        setIsLoading(true)
        try {
            await signup({
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName
            })
            toast.success('Account created successfully!')
            navigate('/dashboard')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create account')
        } finally {
            setIsLoading(false)
        }
    }

    const getStrengthColor = (score) => {
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
        return colors[score] || 'bg-muted'
    }

    const getStrengthTextColor = (score) => {
        const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500']
        return colors[score] || 'text-muted-foreground'
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/5 via-background to-secondary/5 p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

            <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 shadow-2xl border-primary/10">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <Shield className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Start securing your files with end-to-end encryption
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="text"
                                    name="fullName"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="pl-11 h-12 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/50"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

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

                            {formData.password && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex gap-1">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.score ? getStrengthColor(passwordStrength.score) : 'bg-muted'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-sm font-medium ${getStrengthTextColor(passwordStrength.score)}`}>
                                        {passwordStrength.label}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {passwordChecks.map((check, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                {check.met ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-muted-foreground" />
                                                )}
                                                <span className={check.met ? 'text-foreground' : 'text-muted-foreground'}>
                                                    {check.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`pl-11 pr-11 h-12 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/50 ${formData.confirmPassword && formData.password !== formData.confirmPassword
                                            ? 'ring-2 ring-destructive/50'
                                            : formData.confirmPassword && formData.password === formData.confirmPassword
                                                ? 'ring-2 ring-green-500/50'
                                                : ''
                                        }`}
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Passwords do not match
                                </p>
                            )}
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <p className="text-xs text-green-500 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Passwords match
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold gap-2 group"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col gap-5 pt-2">
                    <div className="text-sm text-center text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary hover:underline font-semibold">
                            Sign in
                        </Link>
                    </div>
                    <Badge variant="secondary" className="mx-auto px-4 py-1.5">
                        🔒 Your data is encrypted end-to-end
                    </Badge>
                </CardFooter>
            </Card>
        </div>
    )
}
