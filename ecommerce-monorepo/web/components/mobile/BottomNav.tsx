'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import { Home, Search, ShoppingCart, ClipboardList, Heart, Menu, X, ChevronRight, User, Package, HelpCircle, Phone, Globe, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMobile } from '@/components/MobileProvider'
import { useCart } from '@/components/CartContext'
import { useQuoteCart } from '@/components/QuoteCartContext'
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useWishlist } from '@/hooks/useWishlist'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { useSettings } from '@/components/SettingsProvider'

export function BottomNav() {
  const { isMobile } = useMobile()
  const pathname = usePathname() || ''
  const locale = useLocale()
  const { settings } = useSettings()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  // Cart & Wholesale context
  const { cartCount } = useCart()
  const { quoteCount } = useQuoteCart()
  const { count: inquiryCount } = useWholesaleInquiry()
  const { wishlistCount } = useWishlist()
  const { storeMode } = useStoreMode()
  const { isWholesaleSession } = useSessionMode()

  // Close drawer on path change
  useEffect(() => {
    setIsDrawerOpen(false)
  }, [pathname])

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

  // Normalise path by removing locale prefix: e.g. /en/checkout -> /checkout
  const cleanPath = pathname.replace(/^\/(en|ru|zh)(\/|$)/, '/') || '/'

  // 2.3 Hide on certain pages:
  // /checkout, /quote-cart (submit view), /quotes/view/[token]
  const isHiddenRoute =
    cleanPath === '/checkout' ||
    cleanPath.startsWith('/checkout/') ||
    cleanPath === '/quote-cart' ||
    cleanPath.startsWith('/quote-cart/') ||
    cleanPath.startsWith('/quotes/view')

  if (isHiddenRoute) {
    return null
  }

  // Determine if wholesale or retail
  const isWholesale =
    storeMode === 'WHOLESALE' ? true : storeMode === 'RETAIL' ? false : isWholesaleSession

  const cartHref = isWholesale ? '/quote-cart' : '/cart'
  const effectiveCartCount = isWholesale ? (quoteCount || inquiryCount || 0) : (cartCount || 0)

  // Active route helpers
  const isHomeActive = cleanPath === '/' || cleanPath === ''
  const isSearchActive = cleanPath.startsWith('/store') || cleanPath.startsWith('/products')
  const isCartActive = cleanPath.startsWith('/cart') || cleanPath.startsWith('/quote-cart')
  const isWishlistActive = cleanPath.startsWith('/wishlist')

  // Localized tab labels
  const labels = {
    home: locale === 'zh' ? '首页' : locale === 'ru' ? 'Главная' : 'Home',
    search: locale === 'zh' ? '搜索' : locale === 'ru' ? 'Поиск' : 'Search',
    cart: isWholesale
      ? (locale === 'zh' ? '询价' : locale === 'ru' ? 'Запрос' : 'Quotes')
      : (locale === 'zh' ? '购物车' : locale === 'ru' ? 'Корзина' : 'Cart'),
    wishlist: locale === 'zh' ? '收藏' : locale === 'ru' ? 'Избранное' : 'Wishlist',
    more: locale === 'zh' ? '更多' : locale === 'ru' ? 'Меню' : 'More',
  }

  return (
    <>
      {/* =========================================================================
          BOTTOM NAVIGATION BAR (Mobile only, hidden on md: and above)
          Height: 64px + safe-area-inset-bottom
          z-index: 40 (above page content, below modals at z-50+)
          Tap targets: >= 44px
          ========================================================================= */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-gray-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="h-[64px] max-w-lg mx-auto grid grid-cols-5 items-center px-1">
          {/* 1. HOME */}
          <LocaleLink
            href="/"
            aria-label={labels.home}
            className={`group flex flex-col items-center justify-center min-h-[44px] h-full py-1 transition-colors relative ${
              isHomeActive && !isDrawerOpen
                ? 'text-[#1a3a5c] dark:text-[#c9a84c] font-semibold'
                : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              <Home className="w-6 h-6 transition-transform group-active:scale-90" />
              {isHomeActive && !isDrawerOpen && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
              )}
            </div>
            <span className="text-[10px] leading-tight mt-1 tracking-tight">
              {labels.home}
            </span>
          </LocaleLink>

          {/* 2. SEARCH */}
          <LocaleLink
            href="/store"
            aria-label={labels.search}
            className={`group flex flex-col items-center justify-center min-h-[44px] h-full py-1 transition-colors relative ${
              isSearchActive && !isDrawerOpen
                ? 'text-[#1a3a5c] dark:text-[#c9a84c] font-semibold'
                : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              <Search className="w-6 h-6 transition-transform group-active:scale-90" />
              {isSearchActive && !isDrawerOpen && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
              )}
            </div>
            <span className="text-[10px] leading-tight mt-1 tracking-tight">
              {labels.search}
            </span>
          </LocaleLink>

          {/* 3. CART / QUOTE (Mode-aware) */}
          <LocaleLink
            href={cartHref}
            aria-label={labels.cart}
            className={`group flex flex-col items-center justify-center min-h-[44px] h-full py-1 transition-colors relative ${
              isCartActive && !isDrawerOpen
                ? 'text-[#1a3a5c] dark:text-[#c9a84c] font-semibold'
                : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              {isWholesale ? (
                <ClipboardList className="w-6 h-6 transition-transform group-active:scale-90" />
              ) : (
                <ShoppingCart className="w-6 h-6 transition-transform group-active:scale-90" />
              )}
              {effectiveCartCount > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[18px] h-[18px] px-1 bg-[#c9a84c] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {effectiveCartCount > 99 ? '99+' : effectiveCartCount}
                </span>
              )}
              {isCartActive && !isDrawerOpen && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
              )}
            </div>
            <span className="text-[10px] leading-tight mt-1 tracking-tight">
              {labels.cart}
            </span>
          </LocaleLink>

          {/* 4. WISHLIST */}
          <LocaleLink
            href="/wishlist"
            aria-label={labels.wishlist}
            className={`group flex flex-col items-center justify-center min-h-[44px] h-full py-1 transition-colors relative ${
              isWishlistActive && !isDrawerOpen
                ? 'text-[#1a3a5c] dark:text-[#c9a84c] font-semibold'
                : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              <Heart className="w-6 h-6 transition-transform group-active:scale-90" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
              {isWishlistActive && !isDrawerOpen && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
              )}
            </div>
            <span className="text-[10px] leading-tight mt-1 tracking-tight">
              {labels.wishlist}
            </span>
          </LocaleLink>

          {/* 5. MORE (Opens Drawer) */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-label={labels.more}
            aria-expanded={isDrawerOpen}
            className={`group flex flex-col items-center justify-center min-h-[44px] h-full py-1 transition-colors relative ${
              isDrawerOpen
                ? 'text-[#1a3a5c] dark:text-[#c9a84c] font-semibold'
                : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              {isDrawerOpen ? (
                <X className="w-6 h-6 transition-transform group-active:scale-90 text-[#c9a84c]" />
              ) : (
                <Menu className="w-6 h-6 transition-transform group-active:scale-90" />
              )}
              {isDrawerOpen && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
              )}
            </div>
            <span className="text-[10px] leading-tight mt-1 tracking-tight">
              {labels.more}
            </span>
          </button>
        </div>
      </nav>

      {/* =========================================================================
          MORE NAVIGATION DRAWER (Slide up from bottom on mobile)
          ========================================================================= */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Sheet Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-50 w-full max-h-[80vh] bg-white dark:bg-[#0f172a] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border-t border-gray-100 dark:border-slate-800"
              style={{
                paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Drag Handle Indicator */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full" />
              </div>

              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  {settings?.companyLogo && !logoFailed ? (
                    <div className="flex items-center justify-center shrink-0">
                      <img
                        src={settings.companyLogo}
                        alt={`${settings?.companyName || 'Company'} Logo`}
                        onError={() => setLogoFailed(true)}
                        className="h-8 max-h-8 w-auto max-w-[120px] object-contain shrink-0"
                        loading="eager"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#00407a] dark:bg-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {(settings?.companyName || 'Global Trade')
                        .split(' ')
                        .map((w: string) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'GT'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                      {settings?.companyName || 'Global Trade'}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                      {settings?.siteTagline || (locale === 'zh' ? '全球采购与供应链' : locale === 'ru' ? 'Международная торговля' : 'Global Trade Platform')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="overflow-y-auto px-6 py-4 space-y-4 divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                {/* Account & Profile section */}
                <div className="space-y-1 pt-1">
                  <LocaleLink
                    href="/profile"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-[#c9a84c]" />
                      <span>{locale === 'zh' ? '个人中心' : locale === 'ru' ? 'Профиль' : 'My Account'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </LocaleLink>
                  <LocaleLink
                    href="/orders"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-[#c9a84c]" />
                      <span>{locale === 'zh' ? '我的订单' : locale === 'ru' ? 'Мои заказы' : 'My Orders'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </LocaleLink>
                </div>

                {/* Sourcing & Logistics Services */}
                <div className="space-y-1 pt-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                    {locale === 'zh' ? '服务与工具' : locale === 'ru' ? 'Услуги и инструменты' : 'Services & Tools'}
                  </h4>
                  <LocaleLink
                    href="/track"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span>{locale === 'zh' ? '物流追踪' : locale === 'ru' ? 'Отследить груз' : 'Track Cargo'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </LocaleLink>
                  <LocaleLink
                    href="/calculator"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{locale === 'zh' ? '运费计算器' : locale === 'ru' ? 'Калькулятор доставки' : 'Freight Calculator'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </LocaleLink>
                  <LocaleLink
                    href="/services"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <span>{locale === 'zh' ? '全套服务' : locale === 'ru' ? 'Все услуги' : 'All Services'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </LocaleLink>
                </div>

                {/* About & Support */}
                <div className="space-y-1 pt-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                    {locale === 'zh' ? '关于与客服' : locale === 'ru' ? 'О компании и поддержка' : 'Company & Support'}
                  </h4>
                  <LocaleLink
                    href="/about"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>{locale === 'zh' ? '关于我们' : locale === 'ru' ? 'О нас' : 'About Us'}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </LocaleLink>
                  <LocaleLink
                    href="/contact"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-[#c9a84c]" />
                      <span>{locale === 'zh' ? '联系我们' : locale === 'ru' ? 'Связаться с нами' : 'Contact Us'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </LocaleLink>
                  <LocaleLink
                    href="/faq"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl text-gray-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-gray-500" />
                      <span>{locale === 'zh' ? '常见问题' : locale === 'ru' ? 'Частые вопросы' : 'FAQ'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </LocaleLink>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
