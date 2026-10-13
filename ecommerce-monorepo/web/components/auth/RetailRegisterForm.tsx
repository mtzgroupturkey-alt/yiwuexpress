'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import {
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ArrowRight,
  AlertCircle
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

export interface RetailRegisterFormProps {
  onSuccess?: () => void
  redirectTo?: string
  /** If true, renders a slightly more compact layout suited for tabs */
  compact?: boolean
}

export function RetailRegisterForm({
  onSuccess,
  redirectTo,
  compact = false,
}: RetailRegisterFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const { register: registerUser, isLoading } = useAuth()

  const redirectParam = searchParams.get('redirect') || ''
  const isFromCheckout = redirectParam.includes('checkout')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'United States',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [subscribeNews, setSubscribeNews] = useState(true)
  const [error, setError] = useState('')
  const [dbCountries, setDbCountries] = useState<string[]>([])

  // Fetch active countries from DB if available
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

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = formData.password
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200', width: '0%' }
    let score = 0
    if (pwd.length >= 8) score += 1
    if (pwd.length >= 12) score += 1
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500', width: '33%' }
    if (score <= 3) return { score: 2, label: 'Good', color: 'bg-amber-500', width: '66%' }
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', width: '100%' }
  }, [formData.password])

  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword

  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Please enter your full name')
      return
    }

    if (!formData.email.trim()) {
      setError('Please enter a valid email address')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    if (formData.phone && formData.phone.includes('@')) {
      setError('Please enter a valid phone number (not an email address)')
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          country: formData.country || undefined,
          locale: locale || 'en',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please check your information and try again.')
      }

      setSubmittedEmail(formData.email.trim().toLowerCase())
      setIsSuccessSubmitted(true)
    } catch (err: any) {
      console.error('Registration failed:', err)
      setError(err.message || 'Registration failed. Please check your information and try again.')
    }
  }

  if (isSuccessSubmitted) {
    return (
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 sm:p-8 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Check Your Email</h3>
        <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto leading-relaxed">
          We&apos;ve sent a verification link to <strong className="text-slate-900">{submittedEmail}</strong>. Please click the link to activate your account and start shopping.
        </p>

        <div className="p-4 bg-white/80 border border-emerald-200/80 rounded-xl text-xs text-slate-600 text-left mb-6 space-y-1.5 max-w-sm mx-auto">
          <div className="font-semibold text-slate-800">Quick steps:</div>
          <div>1. Open your email inbox (check Spam if needed).</div>
          <div>2. Click the <strong>Verify Email Address</strong> button.</div>
          <div>3. You will be automatically signed in to your account.</div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsSuccessSubmitted(false)
            setError('')
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
        >
          Use a different email address
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to register</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="retail-reg-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Full Name *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="retail-reg-name"
              type="text"
              required
              autoComplete="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="retail-reg-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="retail-reg-email"
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. customer@example.com"
              className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Phone & Country 2-col row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone Number */}
          <div>
            <label htmlFor="retail-reg-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number <span className="text-slate-400 font-normal">(for SMS tracking)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="retail-reg-phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555 0199"
                className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Country Selector */}
          <div>
            <label htmlFor="retail-reg-country" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Destination Country
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <select
                id="retail-reg-country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="block w-full pl-10 pr-8 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                {countryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="retail-reg-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password *
            </label>
            {formData.password && (
              <span className="text-[11px] font-semibold text-slate-500">
                Strength: <strong className="text-slate-800">{passwordStrength.label}</strong>
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="retail-reg-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 8 characters"
              className="block w-full pl-10 pr-12 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength progress bar */}
          {formData.password && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: passwordStrength.width }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-medium shrink-0">
                Min. 8 characters
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="retail-reg-confirm" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Confirm Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="retail-reg-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Repeat your password"
              className={`block w-full pl-10 pr-12 py-2.5 sm:py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a] transition-all ${
                formData.confirmPassword && !passwordsMatch
                  ? 'border-rose-300 focus:ring-rose-500'
                  : formData.confirmPassword && passwordsMatch
                  ? 'border-emerald-300 focus:ring-emerald-500'
                  : 'border-slate-200'
              }`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {passwordsMatch && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" />
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {formData.confirmPassword && !passwordsMatch && (
            <p className="text-[11px] text-rose-600 mt-1">Passwords do not match</p>
          )}
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#00407a] focus:ring-[#00407a]"
            />
            <span>
              I agree to the{' '}
              <Link href={`/${locale}/terms`} className="text-[#00407a] font-semibold hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href={`/${locale}/privacy`} className="text-[#00407a] font-semibold hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>

          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={subscribeNews}
              onChange={(e) => setSubscribeNews(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#00407a] focus:ring-[#00407a]"
            />
            <span>
              Send me exclusive retail member coupons, parcel shipment updates, and flash deals.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00407a] hover:bg-[#002f5a] active:scale-[0.99] text-white py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>
                  {isFromCheckout ? 'Create Account & Continue to Checkout' : 'Create Free Retail Account'}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
