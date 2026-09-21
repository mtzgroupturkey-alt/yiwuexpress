'use client'

import React from 'react'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { Menu, ShoppingCart, ClipboardList, Bell, Search, X } from 'lucide-react'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { useMobile } from '@/components/MobileProvider'
import { useCart } from '@/components/CartContext'
import { useQuoteCart } from '@/components/QuoteCartContext'
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { BackButton } from './BackButton'

export interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  backHref?: string
  onBack?: () => void
  showSearchToggle?: boolean
  showNotifications?: boolean
  notificationCount?: number
  onNotificationsClick?: () => void
  onMenuClick?: () => void
  className?: string
}

export function MobileHeader({
  title,
  showBack = false,
  backHref,
  onBack,
  showSearchToggle = true,
  showNotifications = true,
  notificationCount = 0,
  onNotificationsClick,
  onMenuClick,
  className = '',
}: MobileHeaderProps) {
  const locale = useLocale()
  const { settings } = useSettings()
  const { openDrawer, toggleDrawer, isSearchOpen, toggleSearch } = useMobile()

  const { cartCount } = useCart()
  const { quoteCount } = useQuoteCart()
  const { count: inquiryCount } = useWholesaleInquiry()
  const { storeMode } = useStoreMode()
  const { isWholesaleSession } = useSessionMode()

  // Determine wholesale vs retail mode for smart cart button
  const isWholesale =
    storeMode === 'WHOLESALE' ? true : storeMode === 'RETAIL' ? false : isWholesaleSession

  const cartHref = isWholesale ? '/quote-cart' : '/cart'
  const effectiveCartCount = isWholesale ? (quoteCount || inquiryCount || 0) : (cartCount || 0)
  const companyName = settings?.companyName || 'Global Trade'

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick()
    } else if (toggleDrawer) {
      toggleDrawer()
    } else if (openDrawer) {
      openDrawer()
    }
  }

  return (
    <header
      data-testid="mobile-header"
      className={`md:hidden sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800 transition-colors ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="h-14 px-2 sm:px-3 flex items-center justify-between gap-2 max-w-lg mx-auto">
        {/* LEFT: Menu Hamburger or Back Button */}
        <div className="flex items-center min-w-[48px]">
          {showBack ? (
            <BackButton
              fallbackHref={backHref}
              onClick={onBack}
              label=""
            />
          ) : (
            <button
              type="button"
              onClick={handleMenuClick}
              aria-label={locale === 'zh' ? '打开菜单' : locale === 'ru' ? 'Открыть меню' : 'Open menu'}
              data-testid="mobile-menu-trigger"
              className="min-w-[48px] min-h-[48px] flex items-center justify-center text-gray-700 dark:text-slate-200 hover:text-gray-950 dark:hover:text-white rounded-full active:scale-95 transition-transform touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* CENTER: Title or Dynamic Logo / Brand Name */}
        <div className="flex-1 flex items-center justify-center overflow-hidden px-1">
          {title ? (
            <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate text-center">
              {title}
            </h1>
          ) : (
            <LocaleLink
              href="/"
              aria-label={companyName}
              className="flex items-center gap-2 max-w-[200px] select-none active:opacity-80 transition-opacity touch-manipulation"
            >
              {settings?.companyLogo ? (
                <div className="relative w-8 h-8 shrink-0">
                  <Image
                    src={settings.companyLogo}
                    alt={`${companyName} Logo`}
                    fill
                    sizes="32px"
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#1a3a5c] dark:bg-primary-600 text-[#c9a84c] dark:text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {companyName
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'GT'}
                </div>
              )}
              <span className="font-bold text-sm tracking-tight text-[#1a3a5c] dark:text-white truncate">
                {companyName}
              </span>
            </LocaleLink>
          )}
        </div>

        {/* RIGHT: Search Toggle, Notifications, Smart Cart */}
        <div className="flex items-center justify-end gap-0.5 min-w-[48px]">
          {showSearchToggle && (
            <button
              type="button"
              onClick={toggleSearch}
              aria-label={isSearchOpen ? 'Close search' : 'Open search'}
              data-testid="mobile-search-toggle"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white rounded-full active:scale-95 transition-transform touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          )}

          {showNotifications && (
            <button
              type="button"
              onClick={onNotificationsClick}
              aria-label="Notifications"
              data-testid="mobile-notifications-trigger"
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white rounded-full active:scale-95 transition-transform touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          )}

          <LocaleLink
            href={cartHref}
            aria-label={isWholesale ? 'Quote Cart' : 'Shopping Cart'}
            data-testid="mobile-cart-trigger"
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-slate-200 hover:text-[#1a3a5c] dark:hover:text-[#c9a84c] rounded-full active:scale-95 transition-transform touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {isWholesale ? (
              <ClipboardList className="w-5 h-5" />
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
            {effectiveCartCount > 0 && (
              <span
                data-testid="mobile-cart-badge"
                className={`absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-xs ${
                  isWholesale ? 'bg-blue-600' : 'bg-secondary-500'
                }`}
              >
                {effectiveCartCount > 99 ? '99+' : effectiveCartCount}
              </span>
            )}
          </LocaleLink>
        </div>
      </div>
    </header>
  )
}
