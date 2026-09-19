'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { NextIntlClientProvider } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { Design3LayoutHeader } from '@/components/layout/Design3LayoutHeader'
import { Design3LayoutFooter } from '@/components/layout/Design3LayoutFooter'
import { Container } from '@/components/design-system/Container'
import { Providers } from '@/components/providers'
import { SettingsProvider } from '@/components/SettingsProvider'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { BackToTop } from '@/components/ui/BackToTop'
import { StoreModeProvider } from '@/contexts/StoreModeContext'
import { SessionModeProvider } from '@/contexts/SessionModeContext'
import { WholesaleInquiryProvider } from '@/contexts/WholesaleInquiryContext'
import { LayoutDashboard, Package, FileText, Heart, MapPin, User, Settings, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react'
import enMessages from '@/messages/en.json'
import ruMessages from '@/messages/ru.json'
import zhMessages from '@/messages/zh.json'

const MESSAGES: Record<string, any> = {
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
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, isInitialized, checkAuth } = useAuth()
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

  // Redirect if not authenticated (only after initialization and loading completes)
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard')
    }
  }, [isInitialized, isLoading, isAuthenticated, router])

  // Show loading state while checking or initializing auth
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div 
            className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" 
            style={{ borderTopColor: '#00407a' }}
          ></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider" suppressHydrationWarning>
            {(MESSAGES[activeLocale].Dashboard as any).loadingPortal}
          </p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Build breadcrumb items from current path
  const currentPath = pathname || '/dashboard'
  const pathSegments = currentPath.split('/').filter(Boolean)

  const breadcrumbLabels =
    (MESSAGES[activeLocale].Dashboard as any).breadcrumb || {}
  const defaultName = (segment: string) =>
    segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

  const dashboardLabels = MESSAGES[activeLocale].Dashboard as any

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
              <SettingsProvider>
                <CurrencyProvider>
                  <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative w-full overflow-x-hidden" lang={activeLocale}>
                    {/* Modern Design-3 Header with Live Search, Mega-Menu, Cart Drawer & User Menu */}
                    <Design3LayoutHeader />

                    {/* Customer Portal Hero & Unified Account Bar */}
                    <div className="bg-white border-b border-slate-200/90 shadow-2xs">
                      <Container className="pt-4 pb-2">
                        {/* Clean Breadcrumb Trail */}
                        <nav aria-label="Breadcrumb" className="mb-4">
                          <ol className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap font-medium">
                            {breadcrumbs.map((crumb, idx) => (
                              <li key={crumb.href || idx} className="flex items-center gap-1.5">
                                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                {idx === breadcrumbs.length - 1 ? (
                                  <span className="font-bold text-slate-900">{crumb.name}</span>
                                ) : (
                                  <Link href={crumb.href} className="hover:text-[#00407a] transition-colors">
                                    {crumb.name}
                                  </Link>
                                )}
                              </li>
                            ))}
                          </ol>
                        </nav>

                        {/* Customer Profile Identity Card */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                          <div className="flex items-center gap-3.5">
                            {/* Avatar */}
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#00407a] to-[#003366] text-white font-black text-lg flex items-center justify-center shadow-xs border-2 border-white ring-2 ring-[#00407a]/20 shrink-0">
                              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                  {user?.name || dashboardLabels.customerAccount}
                                </h1>
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  {dashboardLabels.verifiedBuyer}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                <span>{user?.email}</span>
                                <span className="text-slate-300">•</span>
                                <span className="font-mono text-slate-400">ID: #CUST-{user?.id ? user.id.slice(-6).toUpperCase() : 'PORTAL'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Quick Action Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-1.5 text-xs text-amber-800 font-bold flex items-center gap-1.5 shadow-2xs">
                              <span>🪙</span>
                              <span>{dashboardLabels.tradeLoyaltyMember}</span>
                            </div>
                            <Link
                              href="/store"
                              className="bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>{dashboardLabels.exploreCatalog}</span>
                            </Link>
                          </div>
                        </div>

                        {/* Integrated Sub-Navigation Tabs */}
                        <div className="border-t border-slate-100 pt-2.5 pb-2.5 overflow-x-auto scrollbar-none">
                          <nav className="flex items-center space-x-1 sm:space-x-1.5" aria-label="Dashboard Tabs">
                            {[
                              { href: '/dashboard', label: activeLocale === 'ru' ? 'Обзор' : activeLocale === 'zh' ? '账户概览' : 'Overview', icon: LayoutDashboard },
                              { href: '/dashboard/orders', label: activeLocale === 'ru' ? 'Мои заказы' : activeLocale === 'zh' ? '我的订单' : 'My Orders', icon: Package },
                              { href: '/dashboard/quotes', label: activeLocale === 'ru' ? 'Заявки и КП' : activeLocale === 'zh' ? '询价与报价' : 'Quotes & RFQs', icon: FileText },
                              { href: '/dashboard/wishlist', label: activeLocale === 'ru' ? 'Избранное' : activeLocale === 'zh' ? '收藏夹' : 'Wishlist', icon: Heart },
                              { href: '/dashboard/addresses', label: activeLocale === 'ru' ? 'Адреса' : activeLocale === 'zh' ? '收货地址' : 'Addresses', icon: MapPin },
                              { href: '/dashboard/profile', label: activeLocale === 'ru' ? 'Профиль' : activeLocale === 'zh' ? '个人资料' : 'Profile', icon: User },
                              { href: '/dashboard/settings', label: activeLocale === 'ru' ? 'Настройки' : activeLocale === 'zh' ? '账户设置' : 'Settings', icon: Settings },
                            ].map((tab) => {
                              const isActive = tab.href === '/dashboard' ? currentPath === '/dashboard' : currentPath.startsWith(tab.href)
                              const Icon = tab.icon
                              return (
                                <Link
                                  key={tab.href}
                                  href={tab.href}
                                  className={`whitespace-nowrap px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isActive
                                      ? 'bg-[#00407a] text-white shadow-2xs'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                  }`}
                                >
                                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                  <span>{tab.label}</span>
                                </Link>
                              )
                            })}
                          </nav>
                        </div>
                      </Container>
                    </div>

                    {/* Main Content */}
                    <main className="flex-1 bg-[#F8FAFC]">
                      {children}
                    </main>

                    {/* Modern Design-3 Footer */}
                    <Design3LayoutFooter />

                    {/* Back to Top */}
                    <BackToTop />
                  </div>
                </CurrencyProvider>
              </SettingsProvider>
            </Providers>
          </WholesaleInquiryProvider>
        </SessionModeProvider>
      </StoreModeProvider>
    </NextIntlClientProvider>
  )
}
