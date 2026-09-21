'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Menu, ShoppingCart, ClipboardList, Bell, Search, ArrowLeft } from 'lucide-react'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { useMobile } from '@/components/MobileProvider'
import { useCart } from '@/components/CartContext'
import { useQuoteCart } from '@/components/QuoteCartContext'
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useSessionMode } from '@/contexts/SessionModeContext'

export interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  backHref?: string
  onBack?: () => void
  showSearch?: boolean
  showSearchToggle?: boolean
  onSearchClick?: () => void
  showNotifications?: boolean
  notificationCount?: number
  onNotificationsClick?: () => void
  showCart?: boolean
  onCartClick?: () => void
  onMenuClick?: () => void
  className?: string
}

export function MobileHeader({
  title,
  showBack = false,
  backHref,
  onBack,
  showSearch,
  showSearchToggle = true,
  onSearchClick,
  showNotifications = true,
  notificationCount = 0,
  onNotificationsClick,
  showCart = true,
  onCartClick,
  onMenuClick,
  className = '',
}: MobileHeaderProps) {
  const router = useRouter()
  const locale = useLocale()
  const { settings } = useSettings()
  const { openDrawer, toggleDrawer, toggleSearch } = useMobile()

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

  // Resolve search toggle visibility (accept either showSearch or legacy showSearchToggle)
  const isSearchVisible = showSearch !== undefined ? showSearch : showSearchToggle

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick()
    } else if (toggleDrawer) {
      toggleDrawer()
    } else if (openDrawer) {
      openDrawer()
    }
  }

  const handleBackClick = () => {
    if (onBack) {
      onBack()
    } else if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  const handleSearchAction = () => {
    if (onSearchClick) {
      onSearchClick()
    } else if (toggleSearch) {
      toggleSearch()
    } else {
      router.push(`/${locale}/store`)
    }
  }

  return (
    <header
      data-testid="mobile-header"
      className={`md:hidden fixed top-0 left-0 right-0 z-40 w-full bg-white dark:bg-[#0f172a] border-b border-gray-200/80 dark:border-slate-800 transition-colors shadow-2xs ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="h-14 px-3 flex items-center justify-between gap-1.5 max-w-lg mx-auto">
        {/* LEFT: Menu Hamburger or Back Arrow */}
        <div className="flex items-center min-w-[44px]">
          {showBack ? (
            <button
              type="button"
              onClick={handleBackClick}
              aria-label={locale === 'zh' ? '返回' : locale === 'ru' ? 'Назад' : 'Go back'}
              data-testid="mobile-back-button"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-900 dark:text-white rounded-full active:bg-gray-100 dark:active:bg-slate-800 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMenuClick}
              aria-label={locale === 'zh' ? '打开菜单' : locale === 'ru' ? 'Открыть меню' : 'Open menu'}
              data-testid="mobile-menu-trigger"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-900 dark:text-white rounded-full active:bg-gray-100 dark:active:bg-slate-800 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* CENTER: Text Wordmark (Homepage) or Page Title (Subpages) */}
        <div className="flex-1 flex items-center justify-center overflow-hidden px-2 text-center min-w-0">
          {title ? (
            <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {title}
            </h1>
          ) : (
            <LocaleLink
              href="/"
              aria-label={companyName}
              className="select-none active:opacity-75 transition-opacity touch-manipulation truncate inline-block"
            >
              <span className="text-base sm:text-lg font-black tracking-tight text-[#00407a] dark:text-white truncate">
                {companyName}
              </span>
            </LocaleLink>
          )}
        </div>

        {/* RIGHT: Search, Notifications, Cart (in that strict order) */}
        <div className="flex items-center justify-end gap-0.5 min-w-[44px]">
          {/* 1. Search Icon */}
          {isSearchVisible && (
            <button
              type="button"
              onClick={handleSearchAction}
              aria-label={locale === 'zh' ? '搜索' : locale === 'ru' ? 'Поиск' : 'Search'}
              data-testid="mobile-search-toggle"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-900 dark:text-white rounded-full active:bg-gray-100 dark:active:bg-slate-800 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* 2. Notifications Icon */}
          {showNotifications && (
            <button
              type="button"
              onClick={onNotificationsClick}
              aria-label={locale === 'zh' ? '通知' : locale === 'ru' ? 'Уведомления' : 'Notifications'}
              data-testid="mobile-notifications-trigger"
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-900 dark:text-white rounded-full active:bg-gray-100 dark:active:bg-slate-800 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 ? (
                <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              ) : null}
            </button>
          )}

          {/* 3. Cart Icon with Red Dot Badge (max 99+) */}
          {showCart && (
            <LocaleLink
              href={cartHref}
              onClick={onCartClick}
              aria-label={
                isWholesale
                  ? locale === 'zh' ? '报价询价车' : locale === 'ru' ? 'Корзина запросов' : 'Quote Cart'
                  : locale === 'zh' ? '购物车' : locale === 'ru' ? 'Корзина покупок' : 'Shopping Cart'
              }
              data-testid="mobile-cart-trigger"
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-900 dark:text-white rounded-full active:bg-gray-100 dark:active:bg-slate-800 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {isWholesale ? (
                <ClipboardList className="w-5 h-5 text-[#00407a] dark:text-blue-400" />
              ) : (
                <ShoppingCart className="w-5 h-5 text-gray-900 dark:text-white" />
              )}
              {effectiveCartCount > 0 && (
                <span
                  data-testid="mobile-cart-badge"
                  className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
                >
                  {effectiveCartCount > 99 ? '99+' : effectiveCartCount}
                </span>
              )}
            </LocaleLink>
          )}
        </div>
      </div>
    </header>
  )
}
