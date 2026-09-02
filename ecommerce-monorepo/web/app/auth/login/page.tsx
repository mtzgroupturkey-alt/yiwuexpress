'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Globe, ArrowRight, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { SmokeyBackground } from '@/components/ui/login-form'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [companyLogo, setCompanyLogo] = useState('')
  const [companyName, setCompanyName] = useState('Global Trade')
  const router = useRouter()
  const { login } = useAuth()

  // Fetch company settings
  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          if (data.settings.companyLogo) setCompanyLogo(data.settings.companyLogo)
          if (data.settings.companyName) setCompanyName(data.settings.companyName)
        }
      })
      .catch(err => console.error('Failed to load company settings:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      
      const user = await login(formData.email, formData.password)
      
      const urlParams = new URLSearchParams(window.location.search)
      const redirectUrl = urlParams.get('redirect')
      
      let targetUrl = '/dashboard'
      
      if (redirectUrl && redirectUrl !== '/') {
        targetUrl = redirectUrl
      } else if (user.role === 'ADMIN') {
        targetUrl = '/admin'
      } else if (user.role === 'SUPPLIER') {
        targetUrl = '/dashboard/supplier'
      }
      
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        window.location.href = `https://${window.location.host}${targetUrl}`
      } else {
        window.location.href = targetUrl
      }
    } catch (err) {
      console.error('[LOGIN] Login failed:', err)
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen w-full bg-[#0a1526] overflow-hidden flex items-center justify-center p-4 sm:p-6">
      {/* Interactive WebGL Smokey Background */}
      <SmokeyBackground color="#1a3a5c" backdropBlurAmount="md" className="absolute inset-0 z-0 opacity-80" />

      {/* Top Left Navigation Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition-all group shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Website</span>
        </Link>
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 space-y-6 bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl shadow-black/50">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={`${companyName} Logo`}
                className="h-12 w-auto object-contain drop-shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#c9a84c] to-[#a0843e] shadow-lg shadow-[#c9a84c]/20">
                <Globe size={24} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sign in to {companyName}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 font-medium">
              Access your sourcing & logistics portal
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center gap-2.5 text-red-200 text-xs">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input with Animated Floating Label */}
          <div className="relative z-0">
            <input
              type="email"
              id="floating_email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="block py-3 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-slate-600 appearance-none focus:outline-none focus:ring-0 focus:border-[#c9a84c] peer transition-colors"
              placeholder=" " 
            />
            <label
              htmlFor="floating_email"
              className="absolute text-sm text-slate-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#c9a84c] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 flex items-center gap-2"
            >
              <Mail size={15} />
              Email Address
            </label>
          </div>

          {/* Password Input with Animated Floating Label */}
          <div className="relative z-0">
            <input
              type="password"
              id="floating_password"
              required
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="block py-3 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-slate-600 appearance-none focus:outline-none focus:ring-0 focus:border-[#c9a84c] peer transition-colors"
              placeholder=" "
            />
            <label
              htmlFor="floating_password"
              className="absolute text-sm text-slate-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#c9a84c] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 flex items-center gap-2"
            >
              <Lock size={15} />
              Password
            </label>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-700 bg-slate-800/80 text-[#c9a84c] focus:ring-0 focus:ring-offset-0"
              />
              <span>Remember me</span>
            </label>
            <Link 
              href="/auth/forgot-password" 
              className="text-slate-300 hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-[#1a3a5c] via-[#2563eb] to-[#1a3a5c] bg-[length:200%_auto] hover:bg-right rounded-xl text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 shadow-lg shadow-blue-900/30 transition-all duration-500 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign In
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="pt-2 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-[#c9a84c] hover:text-[#deb859] transition-colors">
            Sign up now
          </Link>
        </div>
      </div>
    </main>
  )
}