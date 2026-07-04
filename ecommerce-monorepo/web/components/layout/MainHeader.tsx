'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, ShoppingCart, Menu, X, ChevronDown, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { useSettings } from '@/components/SettingsProvider'
import { useCart } from '@/components/CartContext'
import { useWishlist } from '@/hooks/useWishlist'
import { SimpleTypingText } from '@/components/ui/SimpleTypingText'
import { UserMenu } from '@/components/layout/UserMenu'

// Nav items defined outside the component so they never cause remounts
const NAV_ITEMS = [
  { name: 'HOME', href: '/' },
  { name: 'SHOP', href: '/products' },
  { name: 'SERVICES', href: '/services' },
  { name: 'ABOUT', href: '/about' },
  { name: 'CONTACT', href: '/contact' },
  { name: 'WHOLESALE', href: '/wholesale', isSpecial: true },
]

const TOP_BAR_LINKS = [
  'About Us', 'Blog', 'Contact Us', 'Wholesale', 'Hospitality', 'Where to buy',
]

export function MainHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)

  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const { settings } = useSettings()

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full">

      {/* ================================================================
          TOP INFO BAR — slides up and hides on scroll
          ================================================================ */}
      <motion.div
        initial={false}
        animate={isSticky ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="bg-[#1a3a5c] text-white hidden md:block"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-[#c9a84c] text-sm drop-shadow-lg">✦</span>
              <SimpleTypingText
                texts={[
                  `WELCOME TO ${(settings?.companyName || 'YIWU EXPRESS').toUpperCase()} — PREMIUM SOURCING`,
                  "GLOBAL TRADE SOLUTIONS — QUALITY YOU CAN TRUST",
                  "WHOLESALE & RETAIL — BEST PRICES GUARANTEED"
                ]}
                typingSpeed={75}
                deletingSpeed={30}
                pauseDuration={2600}
                className="text-white/60 text-sm tracking-wider font-medium"
              />
            </div>
            <div className="flex items-center space-x-6">
              {TOP_BAR_LINKS.map((name) => (
                <Link
                  key={name}
                  href={`/${name.toLowerCase().replace(/ /g, '-')}`}
                  className="hover:text-[#c9a84c] transition-colors uppercase tracking-wider text-[10px] font-medium text-white/70"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================================================================
          MAIN HEADER ROW — always visible, gets blur + shadow on sticky
          ================================================================ */}
      <motion.div
        initial={false}
        animate={isSticky
          ? { backgroundColor: 'rgba(255,255,255,0.96)', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }
          : { backgroundColor: '#ffffff', boxShadow: '0 1px 0 rgba(0,0,0,0.05)' }
        }
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="border-b border-gray-100 w-full"
        style={{ backdropFilter: isSticky ? 'blur(12px)' : 'none' }}
      >
        <Container>
          <div className="flex items-center justify-between min-h-[72px] md:h-20 gap-4">

            {/* ── LOGO ──────────────────────────────────────────────── */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              {settings?.companyLogo ? (
                <div
                  className="relative flex-shrink-0 transition-all duration-300"
                  style={{
                    width: isSticky ? `${(settings?.companyLogoHeight || 40) * 0.8}px` : `${settings?.companyLogoHeight || 40}px`,
                    height: isSticky ? `${(settings?.companyLogoHeight || 40) * 0.8}px` : `${settings?.companyLogoHeight || 40}px`,
                  }}
                >
                  <Image
                    src={settings.companyLogo}
                    alt={`${settings.companyName || 'Company'} Logo`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <div
                  className="bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg transition-all duration-300"
                  style={{
                    width: isSticky ? '32px' : '40px',
                    height: isSticky ? '32px' : '40px',
                  }}
                >
                  {settings?.companyName?.substring(0, 2).toUpperCase() || 'YE'}
                </div>
              )}
              <span
                className="font-bold text-[#1a3a5c] tracking-tight hidden sm:block transition-all duration-300"
                style={{ fontSize: isSticky ? '1.1rem' : '1.35rem' }}
              >
                {settings?.companyName || 'YIWU EXPRESS'}
              </span>
            </Link>

            {/* ── NAV — always rendered, never conditionally removed ─── */}
            <nav className="hidden lg:flex items-center space-x-0.5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap ${item.isSpecial
                    ? 'text-secondary-500 hover:text-secondary-400 hover:bg-secondary-50/50 border border-secondary-500/30'
                    : 'text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-50'
                    }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* ── RIGHT ICONS ────────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-50 rounded-full transition-colors duration-200"
                aria-label="Search"
              >
                {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>

              {/* Language */}
              <div className="relative hidden md:block">
                <button className="flex items-center gap-1 px-2.5 py-1.5 text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-50 rounded-lg transition-colors duration-200 text-sm font-semibold">
                  <span>🇺🇸</span> EN
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Wishlist */}
              <div className="relative">
                <Link
                  href="/dashboard/wishlist"
                  className="relative p-2 text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-50 rounded-full transition-colors duration-200 block"
                  aria-label="Wishlist"
                >
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Cart */}
              <div className="relative">
                <Link
                  href="/cart"
                  className="relative p-2 text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-50 rounded-full transition-colors duration-200 block"
                  aria-label="Shopping cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-secondary-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Account / User Menu */}
              <UserMenu />

              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-2 text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-50 rounded-full transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="py-4 border-t border-gray-100">
                  <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for products..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-gray-800"
                      autoFocus
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </motion.div>

      {/* ================================================================
          MOBILE MENU
          ================================================================ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
          >
            <div className="p-4 space-y-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block py-2 text-gray-700 hover:text-[#1a3a5c] font-medium border-b border-gray-100 ${item.isSpecial ? 'text-secondary-500' : ''
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
                {['All Products', 'Cookware', 'Bakeware', 'Utensils', 'Appliances', 'Tableware'].map((cat) => (
                  <Link
                    key={cat}
                    href={`/products?category=${cat.toLowerCase().replace(' ', '-')}`}
                    className="block py-1.5 text-sm text-gray-600 hover:text-[#1a3a5c]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}