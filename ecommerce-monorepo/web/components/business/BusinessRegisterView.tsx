'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { useCompanyName } from '@/hooks/useCompanyName'
import { CaptchaWidget } from '@/components/ui/CaptchaWidget'
import type { DynamicPageContent } from '@/lib/contentPages'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { LoginForm } from '@/components/auth/LoginForm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Globe,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight
} from 'lucide-react'

const POPULAR_COUNTRIES = [
  'China',
  'United States',
  'United Kingdom',
  'Russia',
  'Belarus',
  'Kazakhstan',
  'Uzbekistan',
  'Germany',
  'France',
  'United Arab Emirates',
  'Saudi Arabia',
  'Canada',
  'Australia',
  'Turkey',
  'Poland',
  'Spain',
  'Italy',
  'Brazil',
  'Mexico',
  'Japan',
  'South Korea',
]

export interface BusinessRegisterViewProps {
  initialContent: DynamicPageContent
}

// Feature Flag: Enable/disable Apple Sign-In on B2B registration (toggle to true when Apple credentials are ready)
const ENABLE_APPLE_SIGN_IN = false

export function BusinessRegisterView({ initialContent }: BusinessRegisterViewProps) {
  const locale = useLocale()
  const router = useRouter()
  const companyName = useCompanyName()
  const t = useTranslations('business')
  const tAuth = useTranslations('auth')

  // Dynamic content passed from server
  const content = initialContent
  const sections = content.sections || {}

  // Form State: 7 simplified required fields (Requirement #2)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    country: 'United States',
    city: '',
    password: '',
    confirmPassword: '',
  })

  const [captchaToken, setCaptchaToken] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'apple' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false)
  const [dbCountries, setDbCountries] = useState<string[]>([])

  // Load countries
  useEffect(() => {
    fetch(`/api/countries?locale=${encodeURIComponent(locale || 'en')}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const names = data.data
            .filter((c: any) => c.isActive)
            .map((c: any) => c.name)
            .filter(Boolean)
          if (names.length > 0) {
            setDbCountries(names)
          }
        }
      })
      .catch(() => {})
  }, [locale])

  const countryOptions = useMemo(() => {
    if (dbCountries.length > 0) return dbCountries
    return POPULAR_COUNTRIES
  }, [dbCountries])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle Apple OAuth Wholesale Registration (if enabled)
  const handleAppleSignIn = async () => {
    if (!ENABLE_APPLE_SIGN_IN) return
    setIsOAuthLoading('apple')
    try {
      // Apple OAuth flow placeholder
      console.warn('[OAuth Apple] Apple sign-in is not yet configured.')
      alert('Apple sign-in is temporarily unavailable.')
    } finally {
      setIsOAuthLoading(null)
    }
  }

  // Handle Email + Password Submission (Requirement #2 & #3 & #4 & #5)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validate 7 required fields
    if (!formData.firstName.trim()) {
      setErrorMessage(t('register.firstName') + ' is required.')
      return
    }
    if (!formData.lastName.trim()) {
      setErrorMessage(t('register.lastName') + ' is required.')
      return
    }
    if (!formData.phone.trim()) {
      setErrorMessage(t('register.phone') + ' is required.')
      return
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please provide a valid business email address.')
      return
    }
    if (!formData.country.trim()) {
      setErrorMessage(t('register.country') + ' is required.')
      return
    }
    if (!formData.city.trim()) {
      setErrorMessage(t('register.city') + ' is required.')
      return
    }
    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    // CAPTCHA is required for traditional Email method (Requirement #4)
    if (!captchaToken) {
      setErrorMessage('Please complete the security CAPTCHA verification before continuing.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register-b2b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim().toLowerCase(),
          country: formData.country.trim(),
          city: formData.city.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          captchaToken: captchaToken,
          locale: locale || 'en',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration.')
      }

      // Email registration is UNVERIFIED until verification link is clicked (Requirement #3)
      setIsSuccessSubmitted(true)
    } catch (err: any) {
      console.error('[Wholesale Register] Error:', err)
      setErrorMessage(err.message || 'An unexpected error occurred during submission.')
    } finally {
      setIsLoading(false)
    }
  }

  const pageTitle = content.metaTitle || `${content.title || t('register.title')} | ${companyName}`

  return (
    <SharedLayout pageTitle={pageTitle}>
      <div className="min-h-screen bg-slate-50 py-10 md:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-100 text-[#00407a] text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
              <Building2 className="w-3.5 h-3.5" />
              <span>{content.badge || 'Wholesale Buyer Registration'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {content.title || t('register.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
              {content.subtitle || t('register.subtitle')}
            </p>

            {/* Trust Highlights */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-5 text-[11px] sm:text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{sections.trustHighlight1 || 'Tier-1 Factory Direct Sourcing'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{sections.trustHighlight2 || 'Strict QC Pre-Shipment Inspection'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{sections.trustHighlight3 || 'FCL / LCL Sea & Air Logistics'}</span>
              </div>
            </div>
          </div>

          {/* Form Card or Verification Sent Screen */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
            {isSuccessSubmitted ? (
              /* Success / Email Verification Pending Screen (Requirement #3) */
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
                  <Mail className="w-8 h-8 stroke-[2.2]" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                  {t('register.verifiedSuccessTitle')}
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
                  {t('register.verifiedSuccessBody', { email: formData.email })}
                </p>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 text-left mb-6 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Next Steps for Wholesale Buyers:</span>
                    <p className="mt-0.5 text-amber-700">
                      1. Open your inbox and click the verification link.<br />
                      2. Complete optional company info (Tax ID, Trade License) in your profile.<br />
                      3. Admin reviews and approves your account for bulk quotes & RFQs.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={`/${locale}/login`}
                    className="w-full sm:w-auto bg-[#00407a] hover:bg-[#003366] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-xs text-center"
                  >
                    Go to Sign In
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccessSubmitted(false)
                      setCaptchaToken('')
                    }}
                    className="w-full sm:w-auto text-xs font-semibold text-slate-600 hover:text-slate-900 py-2.5 px-4"
                  >
                    Back to registration form
                  </button>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="register" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="register">
                    {tAuth('tabs.createAccount') || 'Create Account'}
                  </TabsTrigger>
                  <TabsTrigger value="signIn">
                    {tAuth('tabs.signIn') || 'Sign In'}
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Create Account */}
                <TabsContent value="register" className="space-y-5">
                  {/* Method 1 & 2: Social OAuth Sign-In (Requirement #1: Google & Apple) */}
                  <div className="space-y-3 mb-6">
                    <div className={`grid gap-3 ${ENABLE_APPLE_SIGN_IN ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                      {/* Sign in with Google */}
                      <GoogleButton variant="register" disabled={isOAuthLoading !== null || isLoading} />

                      {/* Sign in with Apple (Temporarily disabled - keep code for future re-enablement) */}
                      {ENABLE_APPLE_SIGN_IN && (
                        <button
                          type="button"
                          disabled={isOAuthLoading !== null || isLoading}
                          onClick={handleAppleSignIn}
                          className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-black hover:bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer active:scale-98"
                        >
                          {isOAuthLoading === 'apple' ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 170 170">
                              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.94-12.02-14.58-6.19-9.52-11.08-20.48-14.67-32.88-3.59-12.4-5.39-24.12-5.39-35.16 0-14.69 3.59-27.18 10.77-37.47 7.18-10.29 16.27-15.54 27.27-15.76 4.79 0 10.15 1.34 16.08 4.02 5.93 2.68 9.77 4.07 11.52 4.17 1.41 0 5.43-1.47 12.06-4.41 6.63-2.94 12.18-4.23 16.66-3.87 12.73.65 22.86 5.56 30.38 14.73-11.08 6.74-16.52 16.08-16.32 28.02.22 9.57 3.91 17.5 11.08 23.8 7.18 6.31 15.65 9.89 25.43 10.76-2.18 6.96-5.02 14.37-8.52 22.25zM119.22 31.84c0-7.39 2.68-14.45 8.04-21.19 5.36-6.74 12.06-10.65 20.1-11.74.22 1.3.33 2.39.33 3.26 0 7.39-2.83 14.67-8.49 21.84-5.66 7.17-12.4 11.1-20.22 11.8-0.22-1.3-.34-2.29-.34-3.02z" />
                            </svg>
                          )}
                          <span>{t('register.continueApple')}</span>
                        </button>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                          {tAuth('orWithEmail') || t('register.orEmail')}
                        </span>
                      </div>
                    </div>
                  </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm animate-shake">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                    <div className="flex-1">{errorMessage}</div>
                  </div>
                )}

                {/* Method 3: Simplified Email Form (Requirement #2: 7 fields only) */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Field 1 & 2: First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        {t('register.firstName')} *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="e.g. John"
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        {t('register.lastName')} *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="e.g. Smith"
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field 3 & 4: Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        {t('register.phone')} *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        {t('register.email')} *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="buyer@company.com"
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field 5 & 6: Country & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        {t('register.country')} *
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <select
                          name="country"
                          required
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                        >
                          {countryOptions.map((countryName) => (
                            <option key={countryName} value={countryName}>
                              {countryName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        {t('register.city')} *
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="e.g. New York, Warsaw, Minsk..."
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field 7: Password + Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        {t('register.password')} *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="At least 8 characters"
                          className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        {t('register.confirmPassword')} *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          required
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm password"
                          className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Requirement #4: CAPTCHA Protection on Email form */}
                  <div className="pt-2">
                    <CaptchaWidget
                      onVerify={(token) => setCaptchaToken(token)}
                      onError={(err) => setErrorMessage(err)}
                    />
                  </div>

                  {/* Profile Note reminder */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-[11px] text-slate-500 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#00407a] shrink-0 mt-0.5" />
                    <span>
                      Company name, Tax ID, and business documents can be added anytime in your profile after registration.
                    </span>
                  </div>

                  {/* Submit button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#F5A602] hover:bg-[#E09500] disabled:bg-amber-300 text-slate-950 font-black px-7 py-3 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-98"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating Wholesale Account...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                          <span>{t('register.submit')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
                </TabsContent>

                {/* Tab 2: Sign In */}
                <TabsContent value="signIn" className="space-y-5">
                  <div className="space-y-3 mb-6">
                    {/* Google OAuth Login */}
                    <GoogleButton variant="login" />

                    {/* Divider */}
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                          {tAuth('orWithEmail') || t('register.orEmail')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Wholesale-only Login Form */}
                  <LoginForm
                    wholesaleOnly
                    redirectTo={`/${locale}/business/dashboard`}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Footer Assistance */}
          <div className="text-center mt-6 text-xs text-slate-500">
            {sections.footerPrompt || 'Already have an active wholesale account?'}{' '}
            <Link
              href={`/${locale}/login?redirect=/${locale}/business/dashboard`}
              className="font-bold text-[#00407a] hover:underline"
            >
              {sections.footerLinkText || 'Sign in to Wholesale Portal'}
            </Link>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
