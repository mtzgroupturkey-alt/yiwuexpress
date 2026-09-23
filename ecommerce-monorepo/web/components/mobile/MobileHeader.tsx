'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Menu, ShoppingCart, ClipboardList, Bell, Search, ArrowLeft, X } from 'lucide-react'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { useMobile } from '@/components/MobileProvider'
import { useCart } from '@/components/CartContext'
import { useQuoteCart } from '@/components/QuoteCartContext'
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { CurrencySwitcher } from '@/components/i18n/CurrencySwitcher'

export interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  backHref?: string
  onBack?: () => void
  showSearch?: boolean
  showSearchToggle?: boolean
  onSearchClick?: () => void
  searchValue?: string
  onSearchChange?: (val: string) => void
  onSearchSubmit?: (e: React.FormEvent) => void
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
  searchValue,
  onSearchChange,
  onSearchSubmit,
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
  const { openDrawer, toggleDrawer, toggleSearch, isStandalone } = useMobile()

  const { cartCount } = useCart()
  const { quoteCount } = useQuoteCart()
  const { count: inquiryCount } = useWholesaleInquiry()
  const { storeMode } = useStoreMode()
  const { isWholesaleSession } = useSessionMode()

  const [localQuery, setLocalQuery] = useState(searchValue || '')

  useEffect(() => {
    if (searchValue !== undefined) {
      setLocalQuery(searchValue)
    }
  }, [searchValue])

  const isWholesale =
    storeMode === 'WHOLESALE' ? true : storeMode === 'RETAIL' ? false : isWholesaleSession

  const cartHref = isWholesale ? '/quote-cart' : '/cart'
  const effectiveCartCount = isWholesale ? (quoteCount || inquiryCount || 0) : (cartCount || 0)
  const companyName = settings?.companyName || 'Global Trade'
  const companyLogo = settings?.companyLogo

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

  const handleCartClick = (e: React.MouseEvent) => {
    if (isWholesale || cartHref === '/quote-cart') {
      return
    }
    if (onCartClick) {
      e.preventDefault()
      onCartClick()
    }
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearchSubmit) {
      onSearchSubmit(e)
    } else if (localQuery.trim()) {
      router.push(`/${locale}/store?search=${encodeURIComponent(localQuery.trim())}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalQuery(val)
    if (onSearchChange) {
      onSearchChange(val)
    }
  }

  const handleClearInput = () => {
    setLocalQuery('')
    if (onSearchChange) {
      onSearchChange('')
    }
  }

  const searchPlaceholder =
    locale === 'zh'
      ? '搜索商品、品牌、工厂…'
      : locale === 'ru'
      ? 'Поиск товаров, брендов…'
      : 'Search products, brands…'

  // ─── BROWSER MODE: E-Commerce Website Mobile Header (2 Rows) ─────────────
  if (!isStandalone) {
    return (
      <header
        data-testid="mobile-header"
        className={`md:hidden fixed top-0 left-0 right-0 z-40 w-full bg-white dark:bg-[#0f172a] border-b border-gray-200/90 dark:border-slate-800 shadow-xs transition-colors ${className}`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Row 1: Brand / Logo on left, language/currency, cart, menu on right */}
        <div className="h-14 px-3.5 sm:px-4 flex items-center justify-between gap-2 max-w-lg mx-auto">
          {/* Left: Back button (if on subpage) or Brand Logo */}
          <div className="flex items-center gap-1.5 min-w-0 shrink">
            {showBack ? (
              <button
                type="button"
                onClick={handleBackClick}
                aria-label={locale === 'zh' ? '返回' : locale === 'ru' ? 'Назад' : 'Go back'}
                data-testid="mobile-back-button"
                className="w-10 h-10 -ml-1 flex items-center justify-center text-gray-700 dark:text-white rounded-full active:bg-gray-100 dark:active:bg-slate-800 transition-colors touch-manipulation shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}

            <LocaleLink
              href="/"
              aria-label={companyName}
              className="flex items-center gap-2 select-none active:opacity-75 transition-opacity touch-manipulation min-w-0"
            >
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="h-8 max-h-8 w-auto object-contain shrink-0"
                  loading="eager"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#00407a] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                  {companyName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-[17px] font-black tracking-tight text-[#00407a] dark:text-white truncate">
                {title || companyName}
              </span>
            </LocaleLink>
          </div>

          {/* Right: Discoverable Language & Currency, Cart, Menu */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Standard Language & Currency selectors (Homepage only to keep subpage headers clean) */}
            {!showBack && !title && (
              <div className="flex items-center gap-1 scale-90 origin-right">
                <LanguageSwitcher variant="header-dropdown" />
                <CurrencySwitcher variant="header-dropdown" />
              </div>
            )}

            {/* Notifications (if enabled) */}
            {showNotifications && notificationCount > 0 && (
              <button
                type="button"
                onClick={onNotificationsClick}
                aria-label={locale === 'zh' ? '通知' : locale === 'ru' ? 'Уведомления' : 'Notifications'}
                data-testid="mobile-notifications-trigger"
                className="relative w-10 h-10 flex items-center justify-center text-gray-700 dark:text-slate-300 rounded-full active:bg-gray-100 dark:active:bg-slate-800 transition-colors touch-manipulation"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              </button>
            )}

            {/* Cart Icon with Live Badge */}
            {showCart && (
              <LocaleLink
                href={cartHref}
                onClick={handleCartClick}
                aria-label={
                  isWholesale
                    ? locale === 'zh' ? '报价询价车' : locale === 'ru' ? 'Корзина запросов' : 'Quote Cart'
                    : locale === 'zh' ? '购物车' : locale === 'ru' ? 'Корзина' : 'Cart'
                }
                data-testid="mobile-cart-trigger"
                className="relative w-10 h-10 flex items-center justify-center text-gray-700 dark:text-slate-200 rounded-full active:bg-gray-100 dark:active:bg-slate-800 transition-colors touch-manipulation"
              >
                {isWholesale ? (
                  <ClipboardList className="w-5 h-5 text-[#00407a] dark:text-blue-400" />
                ) : (
                  <ShoppingCart className="w-5 h-5 text-gray-800 dark:text-white" />
                )}
                {effectiveCartCount > 0 && (
                  <span
                    data-testid="mobile-cart-badge"
                    className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F5A602] text-slate-950 text-[10px] font-black flex items-center justify-center shadow-xs"
                  >
                    {effectiveCartCount > 99 ? '99+' : effectiveCartCount}
                  </span>
                )}
              </LocaleLink>
            )}

            {/* Menu Hamburger Button */}
            {!showBack && (
              <button
                type="button"
                onClick={handleMenuClick}
                aria-label={locale === 'zh' ? '打开菜单' : locale === 'ru' ? 'Открыть меню' : 'Menu'}
                data-testid="mobile-menu-trigger"
                className="w-10 h-10 flex items-center justify-center text-gray-800 dark:text-white rounded-full active:bg-gray-100 dark:active:bg-slate-800 transition-colors touch-manipulation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Website Mobile Search Bar */}
        {isSearchVisible && (
          <div className="px-3.5 sm:px-4 pb-3 pt-1 max-w-lg mx-auto">
            <form onSubmit={handleInputSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={handleSearchAction}
                  data-testid="mobile-search-toggle"
                  aria-label="Search"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 touch-manipulation"
                >
                  <Search className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={localQuery}
                  onChange={handleInputChange}
                  placeholder={searchPlaceholder}
                  className="w-full h-11 pl-10 pr-9 text-sm bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700/80 placeholder-slate-400 focus:outline-none focus:border-[#00407a] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#00407a]/15 transition-all"
                />
                {localQuery ? (
                  <button
                    type="button"
                    onClick={handleClearInput}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 touch-manipulation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                className="h-11 px-4 bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-bold text-xs rounded-xl shrink-0 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                {locale === 'zh' ? '搜索' : locale === 'ru' ? 'Поиск' : 'Search'}
              </button>
            </form>
          </div>
        )}
      </header>
    )
  }

  // ─── STANDALONE / PWA MODE: Native App Header (1 Row, 56px) ───────────────
  return (
    <header
      data-testid="mobile-header"
      className={`md:hidden fixed top-0 left-0 right-0 z-40 w-full bg-white dark:bg-[#0f172a] border-b border-gray-200/80 dark:border-slate-800 shadow-sm transition-colors ${className}`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
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

        {/* CENTER: Text Wordmark or Page Title */}
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

        {/* RIGHT: Search, Notifications, Cart */}
        <div className="flex items-center justify-end gap-0.5 min-w-[44px]">
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

          {showNotifications && (
            <button
              type="button"
              onClick={onNotificationsClick}
              aria-label={locale === 'zh' ? '通知' : locale === 'ru' ? 'Уведомления' : 'Notifications'}
              data-testid="mobile-notifications-trigger"
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-900 dark:text-white rounded-full active:bg-gray-100 dark:active:bg-slate-800 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {showCart && (
            <LocaleLink
              href={cartHref}
              onClick={handleCartClick}
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
