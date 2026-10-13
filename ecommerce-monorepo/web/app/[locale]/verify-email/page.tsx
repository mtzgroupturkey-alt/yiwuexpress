'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { useCompanyName } from '@/hooks/useCompanyName'
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, Mail } from 'lucide-react'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const companyName = useCompanyName()

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [isLoading, setIsLoading] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    if (!token || !email) {
      setIsLoading(false)
      setErrorMessage('Missing verification token or email. Please check your verification link.')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Email verification failed. The link may have expired.')
        }

        setIsSuccess(true)
        setUserData(data.user)
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to verify email address.')
      } finally {
        setIsLoading(false)
      }
    }

    verify()
  }, [token, email])

  const isRetail = userData?.userType === 'RETAIL'
  const pageTitle = isRetail
    ? `Verify Account | ${companyName}`
    : userData?.userType === 'WHOLESALE'
    ? `Verify Wholesale Account | ${companyName}`
    : `Verify Email | ${companyName}`

  return (
    <SharedLayout pageTitle={pageTitle}>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center">
          {isLoading ? (
            <div className="py-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-[#00407a] flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                Verifying Your Email...
              </h2>
              <p className="text-xs text-slate-500">
                Please wait while we confirm your account credentials.
              </p>
            </div>
          ) : isSuccess ? (
            <div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>

              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider rounded-full mb-3">
                Email Confirmed
              </span>

              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Verification Successful!
              </h1>

              {userData?.userType === 'WHOLESALE' ? (
                <>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Your email has been verified. Your wholesale application is currently in{' '}
                    <span className="font-bold text-amber-700">Pending Review</span> by our compliance team.
                  </p>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 text-left mb-6 space-y-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Next Steps:
                    </div>
                    <div>
                      • <strong>Complete Profile:</strong> Add your Company Name, Tax ID, and business details.
                    </div>
                    <div>
                      • <strong>Admin Approval:</strong> Once approved, you will unlock volume wholesale discounts and RFQ quotes.
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link
                      href={`/${locale}/profile`}
                      className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>Complete Business Profile</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/${locale}/business/pending`}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all text-center"
                    >
                      View Application Status
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Your email has been verified and your account is now fully active. You can start shopping right away!
                  </p>

                  <div className="flex flex-col gap-3">
                    <Link
                      href={`/${locale}`}
                      className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>Start Shopping</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/${locale}/profile`}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all text-center"
                    >
                      Go to Account Profile
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
                <AlertCircle className="w-8 h-8 stroke-[2.2]" />
              </div>

              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Verification Failed
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {errorMessage || 'The verification link is invalid or has expired.'}
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  href={`/${locale}/register-b2b`}
                  className="w-full bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-xs text-center"
                >
                  Register Again
                </Link>

                <Link
                  href={`/${locale}/login`}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-2"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </SharedLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#00407a]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
