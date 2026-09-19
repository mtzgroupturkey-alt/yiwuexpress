'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { LocaleLink } from '@/components/LocaleLink'
import { useLocaleNav } from '@/hooks/useLocaleNav'
import { useTranslations, useLocale } from 'next-intl'
import { loginSchema, LoginInput } from '@/lib/validation'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { useSettings } from '@/components/SettingsProvider'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, Globe, Shield, Clock, BarChart3, AlertCircle } from 'lucide-react'

export default function LocalizedLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'
  const router = useRouter()
  const searchParams = useSearchParams()
  const navigate = useLocaleNav()
  const locale = useLocale()
  const t = useTranslations('Auth')
  const { login } = useAuth()

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

      const user = await login(data.email, data.password)

      // Redirect based on role or redirect parameter
      const redirectUrl = searchParams.get('redirect')
      if (redirectUrl && redirectUrl !== '/') {
        window.location.href = redirectUrl
      } else if (user?.role === 'ADMIN') {
        window.location.href = '/admin'
      } else if (user?.role === 'SUPPLIER') {
        window.location.href = '/dashboard/supplier'
      } else {
        // Customer - redirect to dashboard
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed')
      setIsLoading(false)
    }
  }

  return (
    <SharedLayout
      pageTitle={t('signInTitle')}
      pageDescription="Access your business account to manage logistics, quotes, and shipments"
      breadcrumbs={[
        { name: t('signIn'), href: '/login' }
      ]}
    >
      <div className="bg-gray-50 py-12">
        <main className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Login Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#1a3a5c] mb-2">
                    {t('signInTitle')}
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Enter your credentials to access your dashboard and quotes
                  </p>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t('email')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          {...register('email')}
                          className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200 focus:border-primary-500'
                          }`}
                          placeholder="name@business.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          {t('password')}
                        </label>
                        <LocaleLink
                          href="/forgot-password"
                          className="text-xs text-[#1a3a5c] hover:text-[#c9a84c] font-medium transition-colors"
                        >
                          {t('forgotPassword')}
                        </LocaleLink>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Lock className="h-5 w-5" />
                        </div>
                        <input
                          id="password"
                          type="password"
                          {...register('password')}
                          className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200 focus:border-primary-500'
                          }`}
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.password && (
                        <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#1a3a5c] hover:bg-[#122840] text-white py-3 px-4 rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <span>{t('signIn')}</span>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                  <p className="text-sm text-gray-600">
                    {t('noAccount')}{' '}
                    <LocaleLink
                      href="/register"
                      className="font-semibold text-[#1a3a5c] hover:text-[#c9a84c] transition-colors"
                    >
                      {t('registerNow')}
                    </LocaleLink>
                  </p>
                </div>
              </div>

              {/* Benefits Panel */}
              <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0f243a] text-white rounded-2xl p-8 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#c9a84c] text-xs font-semibold uppercase tracking-wider mb-6">
                    ✦ Verified B2B Sourcing
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    Why Trade with {companyName}?
                  </h3>
                  <p className="text-white/70 text-sm mb-8">
                    Direct access to manufacturers in China with comprehensive quality control and door-to-door global logistics.
                  </p>

                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-[#c9a84c]">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Global Logistics Network</h4>
                        <p className="text-white/70 text-xs mt-0.5">
                          Multi-modal sea, air, and rail freight connected to international regional hubs.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-[#c9a84c]">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Guaranteed Quality Inspection</h4>
                        <p className="text-white/70 text-xs mt-0.5">
                          On-site warehouse audits, video verification, and strict export packing standards.
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-[#c9a84c]">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Transparent RFQ Pricing</h4>
                        <p className="text-white/70 text-xs mt-0.5">
                          Instant wholesale tiered pricing and consolidated shipping quotes with zero hidden fees.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-[#c9a84c]">1500+</div>
                    <div className="text-[11px] text-white/60">Partners</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#c9a84c]">50+</div>
                    <div className="text-[11px] text-white/60">Countries</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#c9a84c]">99.5%</div>
                    <div className="text-[11px] text-white/60">On-Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SharedLayout>
  )
}
