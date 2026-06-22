'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginSchema, LoginInput } from '@/lib/validation'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { Building, Mail, Lock, Globe } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Login failed')
      }

      // Save token to localStorage
      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      
      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back to YIWU EXPRESS
            </h1>
            <p className="text-gray-600">
              Sign in to your business account to manage logistics, quotes, and shipments
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Login Form */}
            <div className="bg-white rounded-2xl shadow-brand p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Business Account Login
              </h2>

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

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                      }`}
                      placeholder="company@business.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                  )}
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
                      {...register('password')}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-primary text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In to Business Account'
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Don&apos;t have a business account?{' '}
                  <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700">
                    Register your business
                  </Link>
                </p>
              </div>
            </div>

            {/* Benefits Panel */}
            <div className="bg-gradient-primary text-white rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6">
                Why Join YIWU EXPRESS?
              </h3>

              <ul className="space-y-6">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Globe className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium">Global Trade Network</h4>
                    <p className="text-white/80 text-sm mt-1">
                      Access our network of 1500+ business partners across 50+ countries
                    </p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium">Secure Transactions</h4>
                    <p className="text-white/80 text-sm mt-1">
                      Protected payments and secure document handling
                    </p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium">24/7 Support</h4>
                    <p className="text-white/80 text-sm mt-1">
                      Round-the-clock customer support for your logistics needs
                    </p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium">Real-time Tracking</h4>
                    <p className="text-white/80 text-sm mt-1">
                      Monitor your shipments with our advanced tracking system
                    </p>
                  </div>
                </li>
              </ul>

              <div className="mt-8 p-4 bg-white/10 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">New to Yiwu Market?</span>{' '}
                  Get special onboarding support for first-time importers
                </p>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm mb-6">
              Trusted by businesses worldwide
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">99.5%</div>
                <div className="text-gray-600 text-sm">On-time Delivery</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">1500+</div>
                <div className="text-gray-600 text-sm">Business Partners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">50+</div>
                <div className="text-gray-600 text-sm">Countries Served</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">24/7</div>
                <div className="text-gray-600 text-sm">Customer Support</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}