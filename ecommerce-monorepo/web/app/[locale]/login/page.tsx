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
import { Globe, Shield, BarChart3, Loader2 } from 'lucide-react'

function LoginTabContent() {
  const searchParams = useSearchParams()
  const locale = useLocale()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'
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
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
                      href={redirectParam ? `/business/login?redirect=${encodeURIComponent(redirectParam)}` : '/business/login'}
                      className="font-semibold text-[#1a3a5c] hover:text-[#c9a84c] transition-colors"
                    >
                      Sign in to B2B Wholesale →
                    </LocaleLink>
                  </p>
                </div>
              </div>

              {/* Benefits Panel */}
              <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0f243a] text-white rounded-2xl p-8 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#c9a84c] text-xs font-semibold uppercase tracking-wider mb-6">
                    ✦ Verified Wholesale Sourcing
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
