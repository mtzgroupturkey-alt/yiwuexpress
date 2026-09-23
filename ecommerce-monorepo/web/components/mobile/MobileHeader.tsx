'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Menu, ShoppingCart, ClipboardList, Bell, Search, ArrowLeft, X, TrendingUp } from 'lucide-react'
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

const POPULAR_SEARCH_TAGS: Record<string, string[]> = {
  en: ['Electronics', 'Kitchenware', 'Tools & Hardware', 'Industrial Parts', 'Home Decor', 'Smart Appliances'],
  zh: ['电子数码', '厨用百货', '五金工具', '工业配件', '家居饰品', '智能家电'],
  ru: ['Электроника', 'Посуда', 'Инструменты', 'Запчасти', 'Декор для дома', 'Бытовая техника'],
}

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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
  const popularTags = POPULAR_SEARCH_TAGS[locale] || POPULAR_SEARCH_TAGS.en

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
    setIsSearchExpanded(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
    if (onSearchClick) {
      onSearchClick()
    } else if (toggleSearch) {
      toggleSearch()
    } else {
      router.push(`/${locale}/store`)
    }
  }

  const handleCancelSearch = () => {
    setIsSearchExpanded(false)
    if (!searchValue) {
      setLocalQuery('')
      if (onSearchChange) onSearchChange('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleCancelSearch()
    }
  }

  const handleTagClick = (tag: string) => {
    setLocalQuery(tag)
    if (onSearchChange) onSearchChange(tag)
    setIsSearchExpanded(false)
    router.push(`/${locale}/store?search=${encodeURIComponent(tag)}`)
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
    setIsSearchExpanded(false)
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
    inputRef.current?.focus()
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
        className={`md:hidden fixed top-0 left-0 right-0 z-40 w-full bg-white/98 dark:bg-[#0f172a]/98 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.07)] transition-colors ${className}`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Row 1: Full Brand Name / Logo on left, cart, menu on right (64px height) */}
        <div className="h-16 px-3.5 sm:px-5 flex items-center justify-between gap-3 w-full max-w-4xl mx-auto">
          {/* Left: Back button (if on subpage) and Full Brand Logo & Name */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {showBack ? (
              <button
                type="button"
                onClick={handleBackClick}
                aria-label={locale === 'zh' ? '返回' : locale === 'ru' ? 'Назад' : 'Go back'}
                data-testid="mobile-back-button"
                className="w-10 h-10 -ml-1 flex items-center justify-center text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/60 rounded-xl active:scale-95 transition-all touch-manipulation shrink-0 shadow-2xs"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
            ) : null}

            <LocaleLink
              href="/"
              aria-label={companyName}
              className="flex items-center gap-2.5 select-none active:opacity-80 transition-opacity touch-manipulation min-w-0"
            >
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="h-9 max-h-9 w-auto object-contain shrink-0"
                  loading="eager"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00407a] via-[#00529b] to-[#0066cc] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs ring-1 ring-white/20">
                  {companyName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-[17px] sm:text-lg font-black tracking-tight text-[#00407a] dark:text-white truncate leading-tight">
                  {title || companyName}
                </span>
                {!title && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase leading-none hidden min-[360px]:inline-block mt-0.5">
                    {settings?.siteTagline || 'Global Sourcing & Freight'}
                  </span>
                )}
              </div>
            </LocaleLink>
          </div>

          {/* Right: Notifications, Cart, Menu (plus Language/Currency fallback if search is hidden) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Fallback Language & Currency in Row 1 only if Row 2 (Search) is hidden */}
            {!isSearchVisible && (
              <div className="flex items-center gap-0.5 sm:gap-1 scale-90 origin-right bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-lg border border-slate-200/70 dark:border-slate-700/70 shadow-2xs mr-1">
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
                className="relative w-10 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 active:scale-95 transition-all touch-manipulation shadow-2xs"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#0f172a]">
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
                className="relative w-10 h-10 flex items-center justify-center text-slate-800 dark:text-slate-100 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 active:scale-95 transition-all touch-manipulation shadow-2xs"
              >
                {isWholesale ? (
                  <ClipboardList className="w-5 h-5 text-[#00407a] dark:text-blue-400" />
                ) : (
                  <ShoppingCart className="w-5 h-5 text-slate-800 dark:text-white" />
                )}
                {effectiveCartCount > 0 && (
                  <span
                    data-testid="mobile-cart-badge"
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F5A602] text-slate-950 text-[10px] font-black flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#0f172a]"
                  >
                    {effectiveCartCount > 99 ? '99+' : effectiveCartCount}
                  </span>
                )}
              </LocaleLink>
            )}

            {/* Menu Hamburger Button */}
            {(!showBack || !title) && (
              <button
                type="button"
                onClick={handleMenuClick}
                aria-label={locale === 'zh' ? '打开菜单' : locale === 'ru' ? 'Открыть меню' : 'Menu'}
                data-testid="mobile-menu-trigger"
                className="w-10 h-10 flex items-center justify-center text-white bg-[#00407a] hover:bg-[#003366] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-xs active:scale-95 transition-all touch-manipulation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Language & Currency Switcher + Dynamically Expanding Mobile Search Bar (56px height) */}
        {isSearchVisible && (
          <div className="h-14 px-3.5 sm:px-5 flex items-center gap-2 w-full max-w-4xl mx-auto pb-2.5 pt-0.5">
            {/* Language & Currency selectors in Row 2 (smoothly hides when search expands) */}
            {!isSearchExpanded && (
              <div className="flex items-center gap-0.5 bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs shrink-0 scale-90 sm:scale-95 origin-left transition-all duration-200">
                <LanguageSwitcher variant="header-dropdown" />
                <CurrencySwitcher variant="header-dropdown" />
              </div>
            )}

            {/* Search Input Form (smoothly expands to 100% full width when active) */}
            <form onSubmit={handleInputSubmit} className="flex-1 flex items-center gap-1.5 min-w-0 transition-all duration-200">
              <div className="relative flex-1 min-w-0">
                <button
                  type="button"
                  onClick={handleSearchAction}
                  data-testid="mobile-search-toggle"
                  aria-label="Search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 touch-manipulation"
                >
                  <Search className="w-4 h-4" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={localQuery}
                  onChange={handleInputChange}
                  onFocus={() => setIsSearchExpanded(true)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-white rounded-xl border border-slate-200/80 dark:border-slate-700/80 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#00407a] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#00407a]/15 transition-all shadow-2xs"
                />
                {localQuery ? (
                  <button
                    type="button"
                    onClick={handleClearInput}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 touch-manipulation rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                className="h-10 px-3 sm:px-4 bg-gradient-to-r from-[#F5A602] to-[#FFB72B] hover:from-[#E09500] hover:to-[#F5A602] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shrink-0 active:scale-95 transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>{locale === 'zh' ? '搜索' : locale === 'ru' ? 'Поиск' : 'Search'}</span>
              </button>
              {isSearchExpanded && (
                <button
                  type="button"
                  onClick={handleCancelSearch}
                  className="h-10 px-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl shrink-0 active:scale-95 transition-colors touch-manipulation"
                >
                  {locale === 'zh' ? '取消' : locale === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
              )}
            </form>
          </div>
        )}

        {/* Quick Search Tray (attached below Row 2 when expanded) */}
        {isSearchVisible && isSearchExpanded && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 bg-white/98 dark:bg-[#0f172a]/98 px-3.5 sm:px-5 py-3 shadow-lg transition-all">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {locale === 'zh' ? '热门搜索' : locale === 'ru' ? 'Популярные запросы' : 'Popular Searches'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100/90 hover:bg-amber-500/10 text-slate-700 hover:text-amber-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-amber-400 rounded-lg border border-slate-200/60 dark:border-slate-700/60 transition-colors active:scale-95 touch-manipulation"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Backdrop for expanded search */}
        {isSearchVisible && isSearchExpanded && (
          <div
            onClick={handleCancelSearch}
            className="fixed inset-0 -z-10 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            style={{ top: 'calc(120px + env(safe-area-inset-top, 0px))' }}
            aria-hidden="true"
          />
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
