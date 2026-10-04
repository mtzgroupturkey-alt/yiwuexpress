'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import { Home, Search, ShoppingCart, ClipboardList, Heart, Menu, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMobile } from '@/components/MobileProvider'
import { useCart } from '@/components/CartContext'
import { useQuoteCart } from '@/components/QuoteCartContext'
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useWishlist } from '@/hooks/useWishlist'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useSessionMode } from '@/contexts/SessionModeContext'

export interface BottomNavProps {
  forceVisible?: boolean
}

export function BottomNav({ forceVisible }: BottomNavProps = {}) {
  const { isMobile, isStandalone, isDrawerOpen, toggleDrawer, openDrawer } = useMobile()
  const pathname = usePathname() || ''
  const locale = useLocale()

  // Cart & Wholesale context
  const { cartCount } = useCart()
  const { quoteCount } = useQuoteCart()
  const { count: inquiryCount } = useWholesaleInquiry()
  const { wishlistCount } = useWishlist()
  const { storeMode } = useStoreMode()
  const { isWholesaleSession } = useSessionMode()

  // Normalise path by removing locale prefix: e.g. /en/checkout -> /checkout
  const cleanPath = pathname.replace(/^\/(en|ru|zh)(\/|$)/, '/') || '/'

  // 2.3 Hide on certain pages:
  // /checkout, /quotes/view/[token]
  const isHiddenRoute =
    cleanPath === '/checkout' ||
    cleanPath.startsWith('/checkout/') ||
    cleanPath.startsWith('/quotes/view')

  // Progressive PWA Strategy: BottomNav is hidden in browser mode.
  // Must be after all hooks to comply with Rules of Hooks.
  if ((!isStandalone && !forceVisible) || isHiddenRoute) {
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
        data-testid="mobile-bottom-nav"
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
                <motion.span
                  layoutId="bottomNavActiveDot"
                  className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c9a84c] shadow-[0_0_6px_#c9a84c]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
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
            className={`group flex flex-col items-center justify-center min-h-[44px] h-full py-1 transition-colors relative tap-spring ${
              isSearchActive && !isDrawerOpen
                ? 'text-[#1a3a5c] dark:text-[#c9a84c] font-semibold'
                : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              <Search className="w-6 h-6 transition-transform group-active:scale-90" />
              {isSearchActive && !isDrawerOpen && (
                <motion.span
                  layoutId="bottomNavActiveDot"
                  className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c9a84c] shadow-[0_0_6px_#c9a84c]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
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
            className={`group flex flex-col items-center justify-center min-h-[44px] h-full py-1 transition-colors relative tap-spring ${
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
                <motion.span
                  key={effectiveCartCount}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="absolute -top-1 -right-2.5 min-w-[18px] h-[18px] px-1 bg-[#c9a84c] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md"
                >
                  {effectiveCartCount > 99 ? '99+' : effectiveCartCount}
                </motion.span>
              )}
              {isCartActive && !isDrawerOpen && (
                <motion.span
                  layoutId="bottomNavActiveDot"
                  className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c9a84c] shadow-[0_0_6px_#c9a84c]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
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
            className={`group flex flex-col items-center justify-center min-h-[44px] h-full py-1 transition-colors relative tap-spring ${
              isWishlistActive && !isDrawerOpen
                ? 'text-[#1a3a5c] dark:text-[#c9a84c] font-semibold'
                : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center w-6 h-6">
              <Heart className="w-6 h-6 transition-transform group-active:scale-90" />
              {wishlistCount > 0 && (
                <motion.span
                  key={wishlistCount}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md"
                >
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </motion.span>
              )}
              {isWishlistActive && !isDrawerOpen && (
                <motion.span
                  layoutId="bottomNavActiveDot"
                  className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c9a84c] shadow-[0_0_6px_#c9a84c]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </div>
            <span className="text-[10px] leading-tight mt-1 tracking-tight">
              {labels.wishlist}
            </span>
          </LocaleLink>

          {/* 5. MORE (Opens Drawer) */}
          <button
            type="button"
            onClick={() => {
              if (toggleDrawer) toggleDrawer()
              else if (openDrawer) openDrawer()
            }}
            aria-label={labels.more}
            aria-expanded={Boolean(isDrawerOpen)}
            className={`group flex flex-col items-center justify-center min-h-[44px] h-full py-1 transition-colors relative tap-spring ${
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
                <motion.span
                  layoutId="bottomNavActiveDot"
                  className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c9a84c] shadow-[0_0_6px_#c9a84c]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </div>
            <span className="text-[10px] leading-tight mt-1 tracking-tight">
              {labels.more}
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
