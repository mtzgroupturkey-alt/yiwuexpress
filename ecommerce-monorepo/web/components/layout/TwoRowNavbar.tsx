'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, ClipboardList, User, Menu, X, ChevronDown, Globe, Sparkles, Layers, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { SimpleTypingText } from '@/components/ui/SimpleTypingText'
import { UserMenu } from './UserMenu'
import { WholesaleInquirySlideover } from '@/components/wholesale/WholesaleInquirySlideover'
import { useCart } from '@/components/CartContext'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useRouter as useIntlRouter, usePathname } from '@/i18n/navigation'
import { useSettings } from '@/components/SettingsProvider'

interface Category {
  id: string
  name: string
  slug: string
  children?: Category[]
}

export function TwoRowNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const { cartCount } = useCart()
  const { storeMode } = useStoreMode()
  const { isWholesaleSession } = useSessionMode()
  const { count: inquiryCount } = useWholesaleInquiry()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('Header')

  // Switch locale
  const switchLocale = (newLocale: string) => {
    window.location.href = `/${newLocale}${pathname}`
  }

  const { settings } = useSettings()
  const { data: companyData } = useQuery({
    queryKey: ['company'],
    queryFn: () => api.get('/api/company'),
    staleTime: 60 * 60 * 1000,
  })

  const company = companyData?.data
  const companyName = company?.name || settings?.companyName || 'Global Trade'
  const companyLogo = company?.logo || settings?.companyLogo
  const companyLogoHeight = company?.logoHeight || settings?.companyLogoHeight || 36
  const siteTagline = settings?.siteTagline || 'Global Trade & Logistics Platform'

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'menu', locale],
    queryFn: () => api.get(`/api/categories/menu?includeChildren=true&locale=${locale}`),
    staleTime: 5 * 60 * 1000,
  })

  const categories: Category[] = categoriesData?.data || []

  // High performance scroll listener with passive flag
  useEffect(() => {
    setMounted(true)
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsSticky(window.scrollY > 120)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  const mainNavItems = [
    { nameKey: 'nav.home', href: '/' },
    { nameKey: 'nav.products', href: '/products' },
    { nameKey: 'nav.services', href: '/services' },
    { nameKey: 'nav.about', href: '/about' },
    { nameKey: 'nav.contact', href: '/contact' },
    { nameKey: 'nav.wholesale', href: '/wholesale', isSpecial: true },
  ]

  const showWholesaleIcon =
    storeMode === 'WHOLESALE' ? true : storeMode === 'RETAIL' ? false : isWholesaleSession

  return (
    <header className="relative w-full z-50">
      {/* ─────────────────────────────────────────────────────────────
          1. NORMAL HEADER STATE (TOP OF PAGE)
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full bg-white transition-colors">
        {/* ROW 1: TOP ANNOUNCEMENT BAR */}
        <div className="bg-[#0f2744] text-white/80 text-xs px-4 hidden lg:block w-full border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-9">
            <div className="flex items-center space-x-2.5">
              <span className="text-[#c9a84c] text-xs font-bold animate-pulse">✦</span>
              <SimpleTypingText
                texts={[
                  t('announce.welcome'),
                  t('announce.solutions'),
                  t('announce.wholesale'),
                ]}
                typingSpeed={70}
                deletingSpeed={30}
                pauseDuration={2800}
                className="text-white/85 text-xs tracking-wide font-medium"
              />
            </div>

            <nav className="flex items-center space-x-5" aria-label="Top navigation">
              {mainNavItems.map((item) => (
                <LocaleLink
                  key={item.nameKey}
                  href={item.href}
                  className={`text-white/75 hover:text-white text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    item.isSpecial ? 'text-[#c9a84c] hover:text-[#e8d48b] font-bold' : ''
                  }`}
                >
                  {t(item.nameKey as any)}
                </LocaleLink>
              ))}
            </nav>
          </div>
        </div>

        {/* ROW 2: MAIN BRAND HEADER (LOGO + SEARCH + UTILITIES) */}
        <div className="w-full px-4 border-b border-gray-100/90">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-18 md:h-20 gap-4">
            
            {/* BRAND LOGO & TITLE */}
            <LocaleLink href="/" className="flex items-center gap-3 shrink-0 group">
              {companyLogo ? (
                <div
                  className="relative transition-transform duration-300 group-hover:scale-105"
                  style={{ height: `${companyLogoHeight}px`, width: `${companyLogoHeight * 2}px` }}
                >
                  <Image
                    src={companyLogo}
                    alt={companyName}
                    fill
                    priority
                    sizes="(max-width: 640px) 90px, 160px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-[#c9a84c] to-[#deb859] rounded-xl flex items-center justify-center text-primary-950 font-black text-base shadow-md">
                  {companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'GT'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-black text-[#1a3a5c] tracking-tight font-['Outfit',sans-serif] leading-tight group-hover:text-[#0d2a4a] transition-colors">
                  {companyName}
                </span>
                <span className="text-[11px] text-gray-500 font-medium hidden sm:block">
                  {siteTagline}
                </span>
              </div>
            </LocaleLink>

            {/* SEARCH BAR (DESKTOP) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#c9a84c] transition-colors duration-300" />
                <input
                  type="text"
                  placeholder={t('actions.searchPlaceholder' as any)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 text-sm bg-gray-50/90 border border-gray-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 focus:border-[#c9a84c] focus:bg-white transition-all duration-300 shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="submit"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 bg-[#1a3a5c] hover:bg-[#c9a84c] text-white rounded-xl transition-colors duration-200"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* UTILITY ICONS & USER ACTIONS */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2.5 text-gray-600 hover:text-[#c9a84c] hover:bg-gray-100 rounded-xl transition-all duration-200"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-2 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-xl transition-all duration-200 font-semibold text-xs md:text-sm"
                  aria-label="Select language"
                  aria-expanded={isLangOpen}
                >
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="uppercase">{locale}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                <AnimatePresence>
                  {isLangOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-white shadow-2xl rounded-2xl p-1.5 z-50 border border-gray-100"
                    >
                      <button
                        onClick={() => { switchLocale('en'); setIsLangOpen(false) }}
                        className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition ${
                          locale === 'en' ? 'bg-[#1a3a5c]/10 text-[#1a3a5c]' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🇺🇸</span>
                        <span>{t('lang.en')}</span>
                      </button>
                      <button
                        onClick={() => { switchLocale('ru'); setIsLangOpen(false) }}
                        className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition ${
                          locale === 'ru' ? 'bg-[#1a3a5c]/10 text-[#1a3a5c]' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🇷🇺</span>
                        <span>{t('lang.ru')}</span>
                      </button>
                      <button
                        onClick={() => { switchLocale('zh'); setIsLangOpen(false) }}
                        className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition ${
                          locale === 'zh' ? 'bg-[#1a3a5c]/10 text-[#1a3a5c]' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🇨🇳</span>
                        <span>{t('lang.zh')}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart / Wholesale Inquiry Counter */}
              {showWholesaleIcon ? (
                <button
                  type="button"
                  onClick={() => setIsInquiryOpen(true)}
                  className="relative p-2.5 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-xl transition-all duration-200"
                  aria-label="Wholesale inquiry basket"
                >
                  <ClipboardList className="w-5 h-5" />
                  {inquiryCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md ring-2 ring-white animate-bounce">
                      {inquiryCount}
                    </span>
                  )}
                </button>
              ) : (
                <LocaleLink
                  href="/cart"
                  className="relative p-2.5 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-xl transition-all duration-200"
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-[#c9a84c] to-[#deb859] text-primary-950 text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center shadow-md ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                </LocaleLink>
              )}

              {/* User Account Menu */}
              <UserMenu />

              {/* Mobile Drawer Trigger */}
              <button
                className="lg:hidden p-2.5 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-xl transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ROW 3: FULL CATEGORY NAVIGATION (NORMAL VIEW) */}
        <div className="w-full bg-[#f8fafc] border-b border-gray-200/70 hidden md:block">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center space-x-1 h-11 relative" onMouseLeave={() => { setHoveredCategory(null); setActiveDropdown(null) }}>
              <LocaleLink
                href="/products"
                onMouseEnter={() => setHoveredCategory('all')}
                className="relative px-3.5 py-1.5 text-xs md:text-sm font-semibold text-gray-700 hover:text-[#1a3a5c] transition-colors rounded-lg whitespace-nowrap flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-[#c9a84c]" />
                <span>{t('allProducts')}</span>
                {hoveredCategory === 'all' && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 bg-[#1a3a5c]/8 rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
              </LocaleLink>

              {categories.map((category) => (
                <div
                  key={category.id}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => {
                    setHoveredCategory(category.id)
                    if (category.children?.length) setActiveDropdown(category.id)
                    else setActiveDropdown(null)
                  }}
                >
                  <LocaleLink
                    href={`/products?category=${category.slug}`}
                    className="relative px-3 py-1.5 text-xs md:text-sm font-semibold text-gray-700 hover:text-[#1a3a5c] transition-colors rounded-lg whitespace-nowrap flex items-center gap-1"
                  >
                    <span>{category.name}</span>
                    {category.children && category.children.length > 0 && (
                      <ChevronDown className="w-3 h-3 text-gray-400 group-hover:rotate-180 transition-transform duration-200" />
                    )}
                    {hoveredCategory === category.id && (
                      <motion.div
                        layoutId="navbar-pill"
                        className="absolute inset-0 bg-[#1a3a5c]/8 rounded-lg -z-10"
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                  </LocaleLink>

                  {/* Staggered Flyout Dropdown */}
                  <AnimatePresence>
                    {activeDropdown === category.id && category.children && category.children.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                        className="absolute left-0 top-full mt-1 bg-white shadow-2xl rounded-2xl p-3 min-w-[240px] z-50 border border-gray-100"
                      >
                        <ul className="space-y-1">
                          {category.children.slice(0, 8).map((sub, idx) => (
                            <motion.li
                              key={sub.id}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                            >
                              <LocaleLink
                                href={`/products?category=${sub.slug}`}
                                className="block px-3 py-2 text-xs font-semibold text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-50 rounded-xl transition"
                              >
                                {sub.name}
                              </LocaleLink>
                            </motion.li>
                          ))}
                          {category.children.length > 8 && (
                            <li className="pt-1 border-t border-gray-100">
                              <LocaleLink
                                href={`/products?category=${category.slug}`}
                                className="block px-3 py-2 text-xs font-bold text-[#c9a84c] hover:text-[#deb859] hover:bg-gray-50 rounded-xl transition"
                              >
                                {t('viewAll')} →
                              </LocaleLink>
                            </li>
                          )}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. COMPACT STICKY HEADER (SCROLLED > 120PX)
          Pinned to top of viewport with smooth slide-down animation
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mounted && isSticky && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed top-0 inset-x-0 z-50 bg-white/92 backdrop-blur-md border-b border-gray-200/80 shadow-md transition-all"
          >
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-15 md:h-16 gap-3">
              
              {/* LEFT: Mini Brand */}
              <LocaleLink href="/" className="flex items-center gap-2.5 shrink-0 group">
                {companyLogo ? (
                  <div className="relative w-8 h-8 md:w-9 md:h-9">
                    <Image
                      src={companyLogo}
                      alt={companyName}
                      fill
                      sizes="36px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#c9a84c] to-[#deb859] rounded-lg flex items-center justify-center text-primary-950 font-black text-xs shadow-sm">
                    {companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'GT'}
                  </div>
                )}
                <span className="text-base md:text-lg font-black text-[#1a3a5c] tracking-tight font-['Outfit',sans-serif] hidden sm:block">
                  {companyName}
                </span>
              </LocaleLink>

              {/* CENTER: Scrollable Category Bar (Desktop) */}
              <div className="hidden lg:flex items-center overflow-x-auto no-scrollbar space-x-1 py-1 max-w-2xl">
                <LocaleLink
                  href="/products"
                  className="px-3 py-1 text-xs font-bold text-gray-700 hover:text-[#1a3a5c] hover:bg-[#1a3a5c]/8 rounded-lg whitespace-nowrap transition-colors"
                >
                  {t('allProducts')}
                </LocaleLink>
                {categories.slice(0, 6).map((cat) => (
                  <LocaleLink
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    className="px-3 py-1 text-xs font-semibold text-gray-600 hover:text-[#1a3a5c] hover:bg-[#1a3a5c]/8 rounded-lg whitespace-nowrap transition-colors"
                  >
                    {cat.name}
                  </LocaleLink>
                ))}
              </div>

              {/* RIGHT: Compact Utilities */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Search trigger */}
                <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('actions.searchPlaceholder' as any)}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-100/90 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 focus:bg-white w-36 lg:w-48 transition-all"
                  />
                </form>

                {/* Language Switcher */}
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="px-2 py-1.5 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-lg text-xs font-bold uppercase transition"
                >
                  {locale}
                </button>

                {/* Cart / RFQ */}
                {showWholesaleIcon ? (
                  <button
                    type="button"
                    onClick={() => setIsInquiryOpen(true)}
                    className="relative p-2 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-xl transition"
                    aria-label="Inquiry basket"
                  >
                    <ClipboardList className="w-4 h-4 md:w-5 md:h-5" />
                    {inquiryCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center shadow">
                        {inquiryCount}
                      </span>
                    )}
                  </button>
                ) : (
                  <LocaleLink
                    href="/cart"
                    className="relative p-2 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-xl transition"
                    aria-label="Cart"
                  >
                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-[#c9a84c] text-primary-950 text-[10px] font-extrabold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center shadow">
                        {cartCount}
                      </span>
                    )}
                  </LocaleLink>
                )}

                {/* User Profile */}
                <UserMenu />

                {/* Mobile Drawer Trigger */}
                <button
                  className="lg:hidden p-2 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-lg transition"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          3. MOBILE SEARCH DRAWER
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-white border-b border-gray-100 px-4 py-3 shadow-md"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('actions.searchPlaceholder' as any)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
                autoFocus
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          4. MOBILE NAVIGATION DRAWER
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-b border-gray-200 shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
          >
            <div className="p-5 space-y-4">
              <div className="space-y-1 border-b border-gray-100 pb-3">
                {mainNavItems.map((item) => (
                  <LocaleLink
                    key={item.nameKey}
                    href={item.href}
                    className={`block py-2 text-sm font-semibold rounded-lg px-2 transition ${
                      item.isSpecial ? 'text-[#c9a84c] font-bold' : 'text-gray-800 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t(item.nameKey as any)}
                  </LocaleLink>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                  {t('categories')}
                </p>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <div key={cat.id} className="border-b border-gray-50 pb-1">
                      <LocaleLink
                        href={`/products?category=${cat.slug}`}
                        className="block py-2 px-2 text-sm font-medium text-gray-700 hover:text-[#1a3a5c] rounded-lg"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {cat.name}
                      </LocaleLink>
                      {cat.children && cat.children.length > 0 && (
                        <div className="pl-4 pb-1 space-y-1">
                          {cat.children.map((sub) => (
                            <LocaleLink
                              key={sub.id}
                              href={`/products?category=${sub.slug}`}
                              className="block py-1 text-xs text-gray-500 hover:text-[#1a3a5c]"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {sub.name}
                            </LocaleLink>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wholesale Inquiry Slideover */}
      <WholesaleInquirySlideover
        open={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
      />
    </header>
  )
}

