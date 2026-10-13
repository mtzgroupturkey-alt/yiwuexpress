'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LocaleLink } from '@/components/LocaleLink'
import { useTranslations, useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { useSettings } from '@/components/SettingsProvider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { LoginForm } from '@/components/auth/LoginForm'
import { RetailRegisterForm } from '@/components/auth/RetailRegisterForm'
import { Loader2 } from 'lucide-react'

function LoginTabContent() {
  const searchParams = useSearchParams()
  const tAuth = useTranslations('Auth')
  const t = useTranslations('auth')

  const redirectParam = searchParams.get('redirect') || ''

  return (
    <SharedLayout
      pageTitle={tAuth('signInTitle')}
      pageDescription="Access your account to manage orders, tracking, quotes, and shipments"
      breadcrumbs={[
        { name: tAuth('signIn'), href: '/login' }
      ]}
    >
      <div className="bg-gray-50 py-12">
        <main className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            {/* Login & Register Tabs Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#1a3a5c] mb-2">
                  {tAuth('signInTitle')}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Sign in to your account or register a free account in seconds.
                </p>

                <Tabs defaultValue="signIn" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signIn">
                      {t('retailTabs.signIn') || 'Sign In'}
                    </TabsTrigger>
                    <TabsTrigger value="createAccount">
                      {t('retailTabs.createAccount') || 'Create Account'}
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Sign In */}
                  <TabsContent value="signIn" className="space-y-4">
                    <GoogleButton variant="retail-login" />

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-slate-500">
                          {t('orWithEmail') || 'Or with email'}
                        </span>
                      </div>
                    </div>

                    <LoginForm redirectTo={redirectParam || undefined} />
                  </TabsContent>

                  {/* Tab 2: Create Account */}
                  <TabsContent value="createAccount" className="space-y-4">
                    <GoogleButton variant="retail-register" />

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-slate-500">
                          {t('orWithEmail') || 'Or with email'}
                        </span>
                      </div>
                    </div>

                    <RetailRegisterForm
                      compact
                      redirectTo={redirectParam || undefined}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Are you a wholesale or business buyer?{' '}
                  <LocaleLink
                    href={redirectParam ? `/register-b2b?tab=login&redirect=${encodeURIComponent(redirectParam)}` : '/register-b2b?tab=login'}
                    className="font-semibold text-[#1a3a5c] hover:text-[#c9a84c] transition-colors"
                  >
                    Sign in to B2B Wholesale →
                  </LocaleLink>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SharedLayout>
  )
}

export default function LocalizedLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#1a3a5c] animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading sign in...</p>
          </div>
        </div>
      }
    >
      <LoginTabContent />
    </Suspense>
  )
}
