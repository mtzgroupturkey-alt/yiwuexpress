'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export interface LoginFormProps {
  redirectTo?: string
  onSuccess?: () => void
  /** If true, only WHOLESALE and BOTH userTypes can log in. */
  wholesaleOnly?: boolean
}

export function LoginForm({
  redirectTo,
  onSuccess,
  wholesaleOnly = false,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const router = useRouter()
  const locale = useLocale()
  const tAuth = useTranslations('auth')
  const { logout } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage(
        tAuth('wholesaleLogin.errors.invalidCredentials') ||
          'Invalid email or password'
      )
      return
    }

    try {
      setIsLoading(true)

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ||
            tAuth('wholesaleLogin.errors.invalidCredentials') ||
            'Invalid email or password'
        )
      }

      const user = data.user

      // If wholesaleOnly, reject non-wholesale accounts and clear the active session
      if (wholesaleOnly) {
        if (user?.role === 'ADMIN') {
          await logout()
          setErrorMessage(
            tAuth('wholesaleLogin.errors.isAdmin') ||
              'Admin accounts must sign in at /auth/login.'
          )
          setIsLoading(false)
          return
        }

        if (user?.userType === 'RETAIL') {
          await logout()
          setErrorMessage(
            tAuth('wholesaleLogin.errors.notWholesale') ||
              'This login is for wholesale accounts only. Retail customers should sign in at /login.'
          )
          setIsLoading(false)
          return
        }
      }

      if (onSuccess) {
        onSuccess()
      } else if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push(`/${locale}/business/dashboard`)
      }
    } catch (err: any) {
      console.error('[LoginForm] Login error:', err)
      setErrorMessage(
        err.message ||
          tAuth('wholesaleLogin.errors.serverError') ||
          'Something went wrong. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs sm:text-sm animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
          {tAuth('wholesaleLogin.email') || 'Email'} *
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="buyer@company.com"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00407a] focus:bg-white transition-all text-slate-800"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {tAuth('wholesaleLogin.password') || 'Password'} *
          </label>
          <Link
            href={`/${locale}/forgot-password`}
            className="text-xs font-semibold text-[#00407a] hover:underline"
          >
            {tAuth('wholesaleLogin.forgotPassword') || 'Forgot password?'}
          </Link>
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00407a] focus:bg-white transition-all text-slate-800"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>
              {tAuth('wholesaleLogin.signingIn') || 'Signing in...'}
            </span>
          </>
        ) : (
          <span>{tAuth('wholesaleLogin.submit') || 'Sign In'}</span>
        )}
      </button>
    </form>
  )
}
