'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { TwoRowNavbar } from '@/components/layout/TwoRowNavbar'
import Footer from '@/components/footer'
import { PageHero } from '@/components/layout/PageHero'
import { Providers } from '@/components/providers'
import { StoreModeProvider } from '@/contexts/StoreModeContext'
import { SessionModeProvider } from '@/contexts/SessionModeContext'
import { WholesaleInquiryProvider } from '@/contexts/WholesaleInquiryContext'
import enMessages from '@/messages/en.json'
import ruMessages from '@/messages/ru.json'
import zhMessages from '@/messages/zh.json'

const MESSAGES: Record<string, typeof enMessages> = {
  en: enMessages,
  ru: ruMessages,
  zh: zhMessages,
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth()
  const hasCheckedAuth = useRef(false)

  // Resolve the active locale: ?locale= param (set by the navbar switcher on
  // unlocalized routes), falling back to the persisted cookie, then English.
  const cookieLocale =
    typeof document !== 'undefined'
      ? (document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/) || [])[1]
      : undefined
  const locale =
    searchParams.get('locale') || cookieLocale || 'en'
  const activeLocale = MESSAGES[locale] ? locale : 'en'

  // Persist the chosen locale so reloads/same-tab navigations keep it.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${activeLocale}; path=/; max-age=31536000; samesite=lax`
    }
  }, [activeLocale])

  // Only check auth once on mount
  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true
      checkAuth()
    }
  }, [checkAuth])

  // Redirect if not authenticated (only after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard')
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div 
            className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" 
            style={{ borderTopColor: '#1a3a5c' }}
          ></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Build breadcrumb items from current path
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/dashboard'
  const pathSegments = currentPath.split('/').filter(Boolean)

  const breadcrumbLabels =
    (MESSAGES[activeLocale].Dashboard as any).breadcrumb || {}
  const defaultName = (segment: string) =>
    segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

  const breadcrumbs = [
    { name: breadcrumbLabels.home || 'Home', href: '/' },
  ]
  let accumulatedPath = ''

  for (const segment of pathSegments) {
    accumulatedPath += `/${segment}`
    const name = breadcrumbLabels[segment] || defaultName(segment)
    breadcrumbs.push({ name, href: accumulatedPath })
  }

  return (
    <NextIntlClientProvider locale={activeLocale} messages={MESSAGES[activeLocale]}>
      <StoreModeProvider>
        <SessionModeProvider>
          <WholesaleInquiryProvider>
            <Providers>
              <div className="min-h-screen bg-gray-50 flex flex-col relative w-full overflow-x-hidden" lang={activeLocale}>
                {/* Header with Top Bar + Main Header + Mega Menu */}
                <TwoRowNavbar />

                {/* Breadcrumb Section */}
                <PageHero
                  title={`${MESSAGES[activeLocale].Dashboard.welcome} ${user?.name || 'User'}!`}
                  description={MESSAGES[activeLocale].Dashboard.manageDesc}
                  breadcrumbs={breadcrumbs}
                />

                {/* Main Content */}
                <main className="flex-1 bg-gray-50">
                  {children}
                </main>

                {/* Footer */}
                <Footer />
              </div>
            </Providers>
          </WholesaleInquiryProvider>
        </SessionModeProvider>
      </StoreModeProvider>
    </NextIntlClientProvider>
  )
}
