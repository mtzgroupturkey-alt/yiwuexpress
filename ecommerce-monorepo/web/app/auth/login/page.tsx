'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building, Mail, Lock, Globe } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

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
    
    console.log('[LOGIN] Starting login process...')
    console.log('[LOGIN] Current URL:', window.location.href)
    console.log('[LOGIN] Protocol:', window.location.protocol)
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      console.log('[LOGIN] Calling login API...')
      
      // ✅ MIGRATED TO COOKIE-BASED AUTH - useAuth handles httpOnly cookies
      const user = await login(formData.email, formData.password)
      
      console.log('[LOGIN] Login successful!', { 
        userId: user.id, 
        role: user.role,
        email: user.email 
      })
      
      // Get redirect URL from query params
      const urlParams = new URLSearchParams(window.location.search)
      const redirectUrl = urlParams.get('redirect')
      
      console.log('[LOGIN] Redirect URL from params:', redirectUrl)
      
      // Redirect based on role or redirect parameter
      let targetUrl = '/dashboard'
      
      if (redirectUrl && redirectUrl !== '/') {
        // If there's a redirect URL, use it
        targetUrl = redirectUrl
        console.log('[LOGIN] Using redirect parameter:', targetUrl)
      } else if (user.role === 'ADMIN') {
        targetUrl = '/admin'
        console.log('[LOGIN] Admin user, redirecting to:', targetUrl)
      } else if (user.role === 'SUPPLIER') {
        targetUrl = '/dashboard/supplier'
        console.log('[LOGIN] Supplier user, redirecting to:', targetUrl)
      } else {
        // Customer (USER role) - redirect to dashboard
        console.log('[LOGIN] Customer user, redirecting to:', targetUrl)
      }
      
      console.log('[LOGIN] Final redirect URL:', targetUrl)
      console.log('[LOGIN] Performing redirect with window.location.href...')
      
      // Force HTTPS if in production
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        console.warn('[LOGIN] WARNING: Using HTTP in production, forcing HTTPS redirect')
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Back to Website Link */}
      <div className="absolute top-4 left-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#1a3a5c] transition-colors group"
        >
          <svg 
            className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Website
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={`${companyName} Logo`}
              className="h-16 w-auto object-contain"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #c9a84c, #a0843e)' }}>
              <Globe size={24} className="text-white" />
            </div>
          )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to {companyName}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your logistics dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <Lock className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@yiwuexpress.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #1a3a5c, #2563eb)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Don't have an account */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </div>

          {/* Back to Website Link - Mobile friendly */}
          <div className="mt-4 text-center sm:hidden">
            <Link 
              href="/" 
              className="text-sm font-medium text-gray-500 hover:text-[#1a3a5c]"
            >
              ← Back to Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}