'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, ClipboardList, User, Menu, X, ChevronDown, Globe, Sparkles, Layers, ArrowRight, Heart, PhoneCall, LayoutGrid, MapPin, Clock, Gift } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { SimpleTypingText } from '@/components/ui/SimpleTypingText'
import { UserMenu } from './UserMenu'
import { MegaMenuDrawer } from './MegaMenuDrawer'
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

const SEARCH_PLACEHOLDERS: Record<string, string[]> = {
  ru: [
    'Поиск станков и оборудования...',
    'Искать ручной и электроинструмент...',
    'Поиск пресс-форм и оснастки...',
    'Искать промышленные комплектующие...'
  ],
  en: [
    'Search CNC machinery & tools...',
    'Search industrial hardware & drills...',
    'Search hydraulic presses & molds...',
    'Search factory-direct equipment...'
  ],
  zh: [
    '搜索数控机床与精密五金...',
    '搜索工业级气动及电动工具...',
    '搜索源头工厂模具与配件...',
    '搜索大宗集采工业品现货...'
  ]
}

export function TwoRowNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [selectedCity, setSelectedCity] = useState('Минск')
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
  const companyLogo = company?.logo || settings?.companyLogo || '/logo.png'
  const companyLogoHeight = company?.logoHeight || settings?.companyLogoHeight || 36
  const siteTagline = settings?.siteTagline?.trim() || ''
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    setLogoFailed(false)
  }, [companyLogo])

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

  // Rotating search placeholder timer (5element.by style)
  useEffect(() => {
    const list = SEARCH_PLACEHOLDERS[locale] || SEARCH_PLACEHOLDERS.en
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % list.length)
    }, 3200)
    return () => clearInterval(timer)
  }, [locale])

  const currentPlaceholderList = SEARCH_PLACEHOLDERS[locale] || SEARCH_PLACEHOLDERS.en
  const currentPlaceholder = currentPlaceholderList[placeholderIndex] || currentPlaceholderList[0]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  const mainNavItems = [
    { nameKey: 'nav.home', href: '/' },
    { nameKey: 'nav.products', href: '/store' },
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
        {/* ROW 1: TOP UTILITY & SERVICE BAR (5element & oma style) */}
        <div className="bg-[#0f2744] text-white/80 text-xs px-4 hidden lg:block w-full border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-9">
            {/* Left: City Selector, Working Hours & Loyalty Link */}
            <div className="flex items-center space-x-4">
              {/* City selector */}
              <div className="flex items-center gap-1.5 text-white/90 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#c9a84c]" />
                <span className="text-[11px] text-white/70">{locale === 'ru' ? 'Город:' : 'City:'}</span>
                <span className="font-bold text-white hover:text-[#c9a84c] cursor-pointer transition">
                  {locale === 'ru' ? selectedCity : 'Minsk / Global'}
                </span>
              </div>

              <span className="text-white/30">•</span>

              {/* Working Hours */}
              <div className="flex items-center gap-1.5 text-white/75 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{locale === 'ru' ? 'Пн-Вс: 08:00 - 21:00' : 'Mon-Sun: 08:00 - 21:00'}</span>
              </div>

              <span className="text-white/30">•</span>

              {/* Loyalty Program link */}
              <LocaleLink
                href="/services"
                className="flex items-center gap-1 text-[#e5c158] hover:text-white transition text-[11px] font-bold"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Бонусная программа' : 'Loyalty Program'}</span>
              </LocaleLink>

              <div className="hidden xl:flex items-center space-x-3 text-white/50 text-xs pl-2 border-l border-white/10">
                <LocaleLink href="/track" className="hover:text-white transition flex items-center gap-1">
                  <span>{t('trackOrder' as any) || (locale === 'ru' ? 'Отследить заказ' : 'Track Order')}</span>
                </LocaleLink>
                <span>•</span>
                <a href="tel:+8657985551234" className="hover:text-[#c9a84c] transition flex items-center gap-1 font-mono">
                  <PhoneCall className="w-3 h-3 text-[#c9a84c]" />
                  <span>+86 579 8555 1234</span>
                </a>
              </div>
            </div>

            {/* Right: Nav items */}
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

        {/* ROW 2: MAIN BRAND HEADER (LOGO + BOLD #0055A4 CATALOG + ROTATING SEARCH + 22px ACTION ICONS) */}
        <div className="w-full px-4 border-b border-gray-100/90">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-18 md:h-20 gap-4">
            
            {/* BRAND LOGO & TITLE */}
            <LocaleLink href="/" className="flex items-center gap-3 shrink-0 group">
              {companyLogo && !logoFailed ? (
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
                    onError={() => setLogoFailed(true)}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-[#0055A4] to-[#003d75] rounded-xl flex items-center justify-center text-white font-black text-base shadow-md">
                  {companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'GT'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-black text-[#0055A4] tracking-tight font-['Outfit',sans-serif] leading-tight group-hover:text-[#003d75] transition-colors">
                  {companyName}
                </span>
                {siteTagline ? (
                  <span className="text-[11px] text-gray-500 font-medium hidden sm:block">
                    {siteTagline}
                  </span>
                ) : null}
              </div>
            </LocaleLink>

            {/* SEARCH BAR WITH ROTATING PLACEHOLDER (DESKTOP) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-2 lg:mx-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0055A4] transition-colors duration-300" />
                <input
                  type="text"
                  placeholder={currentPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 text-sm bg-gray-50/90 border border-gray-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0055A4]/40 focus:border-[#0055A4] focus:bg-white transition-all duration-300 shadow-xs placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    type="submit"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 bg-[#0055A4] hover:bg-[#004080] text-white rounded-xl transition-colors duration-200 shadow-sm"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* 22px ACTION ICONS & USER HUB (emall.by / 5element style) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2.5 text-gray-700 hover:text-[#0055A4] hover:bg-gray-100 rounded-xl transition-all duration-200"
                aria-label="Search"
              >
                <Search className="w-[22px] h-[22px]" />
              </button>

              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:text-[#0055A4] hover:bg-blue-50/60 rounded-xl transition-all duration-200 font-bold text-xs md:text-sm"
                  aria-label="Select language"
                  aria-expanded={isLangOpen}
                >
                  <Globe className="w-[22px] h-[22px] text-gray-500 hover:text-[#0055A4]" />
                  <span className="uppercase">{locale}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
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
                          locale === 'en' ? 'bg-[#0055A4]/10 text-[#0055A4]' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🇺🇸</span>
                        <span>{t('lang.en')}</span>
                      </button>
                      <button
                        onClick={() => { switchLocale('ru'); setIsLangOpen(false) }}
                        className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition ${
                          locale === 'ru' ? 'bg-[#0055A4]/10 text-[#0055A4]' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🇷🇺</span>
                        <span>{t('lang.ru')}</span>
                      </button>
                      <button
                        onClick={() => { switchLocale('zh'); setIsLangOpen(false) }}
                        className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition ${
                          locale === 'zh' ? 'bg-[#0055A4]/10 text-[#0055A4]' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🇨🇳</span>
                        <span>{t('lang.zh')}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wishlist Link (22px with hover heart animation) */}
              <LocaleLink
                href="/profile?tab=wishlist"
                className="relative p-2.5 text-gray-700 hover:text-red-600 hover:bg-red-50/70 rounded-xl transition-all duration-200 hidden sm:inline-flex group"
                aria-label="Wishlist"
              >
                <Heart className="w-[22px] h-[22px] group-hover:scale-110 group-hover:fill-red-500 transition-transform duration-200" />
              </LocaleLink>

              {/* Cart / Wholesale Inquiry Counter (22px icon + badge) */}
              {showWholesaleIcon ? (
                <button
                  type="button"
                  onClick={() => setIsInquiryOpen(true)}
                  className="relative p-2.5 text-gray-700 hover:text-[#0055A4] hover:bg-blue-50/70 rounded-xl transition-all duration-200 group"
                  aria-label="Wholesale inquiry basket"
                >
                  <ClipboardList className="w-[22px] h-[22px] group-hover:scale-105 transition-transform" />
                  {inquiryCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#0055A4] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md ring-2 ring-white animate-bounce">
                      {inquiryCount}
                    </span>
                  )}
                </button>
              ) : (
                <LocaleLink
                  href="/cart"
                  className="relative p-2.5 text-gray-700 hover:text-[#0055A4] hover:bg-blue-50/70 rounded-xl transition-all duration-200 group"
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart className="w-[22px] h-[22px] group-hover:scale-105 transition-transform" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md ring-2 ring-white animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </LocaleLink>
              )}

              {/* User Account Menu */}
              <UserMenu />

              {/* Mobile Drawer Trigger */}
              <button
                className="lg:hidden p-2.5 text-gray-700 hover:text-[#0055A4] hover:bg-gray-100 rounded-xl transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-[22px] h-[22px]" /> : <Menu className="w-[22px] h-[22px]" />}
              </button>
            </div>
          </div>
        </div>

        {/* ROW 3: FULL CATEGORY NAVIGATION (NORMAL VIEW) */}
        <div className="w-full bg-[#f8fafc] border-b border-gray-200/70 hidden md:block">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center space-x-1 h-11 relative" onMouseLeave={() => { setHoveredCategory(null); setActiveDropdown(null) }}>
              <button
                onClick={() => setIsCatalogOpen(true)}
                className="relative px-4 py-2 text-xs md:text-sm font-black text-white bg-gradient-to-r from-[#0055A4] to-[#003d75] hover:from-[#003d75] hover:to-[#0055A4] transition-all rounded-lg whitespace-nowrap flex items-center gap-1.5 shadow-md hover:shadow-lg"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('catalog' as any) || (locale === 'ru' ? 'Каталог' : locale === 'zh' ? '分类' : 'Catalog')}</span>
              </button>

              <LocaleLink
                href="/store"
                onMouseEnter={() => setHoveredCategory('all')}
                className="relative px-3.5 py-1.5 text-xs md:text-sm font-semibold text-gray-700 hover:text-[#0055A4] transition-colors rounded-lg whitespace-nowrap flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-[#0055A4]" />
                <span>{t('allProducts')}</span>
                {hoveredCategory === 'all' && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 bg-[#0055A4]/10 rounded-lg -z-10"
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
                    href={`/store?category=${category.slug}`}
                    className="relative px-3 py-1.5 text-xs md:text-sm font-semibold text-gray-700 hover:text-[#0055A4] transition-colors rounded-lg whitespace-nowrap flex items-center gap-1"
                  >
                    <span>{category.name}</span>
                    {category.children && category.children.length > 0 && (
                      <ChevronDown className="w-3 h-3 text-gray-400 group-hover:rotate-180 transition-transform duration-200" />
                    )}
                    {hoveredCategory === category.id && (
                      <motion.div
                        layoutId="navbar-pill"
                        className="absolute inset-0 bg-[#0055A4]/10 rounded-lg -z-10"
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
                                href={`/store?category=${sub.slug}`}
                                className="block px-3 py-2 text-xs font-semibold text-gray-700 hover:text-[#0055A4] hover:bg-gray-50 rounded-xl transition"
                              >
                                {sub.name}
                              </LocaleLink>
                            </motion.li>
                          ))}
                          {category.children.length > 8 && (
                            <li className="pt-1 border-t border-gray-100">
                              <LocaleLink
                                href={`/store?category=${category.slug}`}
                                className="block px-3 py-2 text-xs font-bold text-[#0055A4] hover:text-[#003d75] hover:bg-gray-50 rounded-xl transition"
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
            className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-md transition-all"
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
                  <div className="w-8 h-8 bg-gradient-to-br from-[#0055A4] to-[#003d75] rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm">
                    {companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'GT'}
                  </div>
                )}
                <span className="text-base md:text-lg font-black text-[#0055A4] tracking-tight font-['Outfit',sans-serif] hidden sm:block">
                  {companyName}
                </span>
              </LocaleLink>

              {/* Sticky Catalog Trigger Button (#0055A4) */}
              <button
                onClick={() => setIsCatalogOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0055A4] hover:bg-[#004080] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition"
                aria-label="Open catalog"
              >
                <LayoutGrid className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">{t('catalog' as any) || (locale === 'ru' ? 'Каталог' : 'Catalog')}</span>
              </button>

              {/* CENTER: Scrollable Category Bar (Desktop) */}
              <div className="hidden lg:flex items-center overflow-x-auto no-scrollbar space-x-1 py-1 max-w-xl">
                <LocaleLink
                  href="/store"
                  className="px-3 py-1 text-xs font-bold text-gray-700 hover:text-[#0055A4] hover:bg-[#0055A4]/8 rounded-lg whitespace-nowrap transition-colors"
                >
                  {t('allProducts')}
                </LocaleLink>
                {categories.slice(0, 6).map((cat) => (
                  <LocaleLink
                    key={cat.id}
                    href={`/store?category=${cat.slug}`}
                    className="px-3 py-1 text-xs font-semibold text-gray-600 hover:text-[#0055A4] hover:bg-[#0055A4]/8 rounded-lg whitespace-nowrap transition-colors"
                  >
                    {cat.name}
                  </LocaleLink>
                ))}
              </div>

              {/* RIGHT: Compact Utilities */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Search trigger with rotating placeholder */}
                <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={currentPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-100/90 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0055A4]/40 focus:bg-white w-36 lg:w-48 transition-all"
                  />
                </form>

                {/* Language Switcher */}
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="px-2 py-1.5 text-gray-700 hover:text-[#0055A4] hover:bg-gray-100 rounded-lg text-xs font-bold uppercase transition"
                >
                  {locale}
                </button>

                {/* Wishlist Link */}
                <LocaleLink
                  href="/profile?tab=wishlist"
                  className="p-2 text-gray-700 hover:text-red-600 hover:bg-gray-100 rounded-xl transition hidden sm:inline-flex"
                  aria-label="Wishlist"
                >
                  <Heart className="w-4 h-4 md:w-5 md:h-5" />
                </LocaleLink>

                {/* Cart / RFQ */}
                {showWholesaleIcon ? (
                  <button
                    type="button"
                    onClick={() => setIsInquiryOpen(true)}
                    className="relative p-2 text-gray-700 hover:text-[#0055A4] hover:bg-gray-100 rounded-xl transition"
                    aria-label="Inquiry basket"
                  >
                    <ClipboardList className="w-4 h-4 md:w-5 md:h-5" />
                    {inquiryCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-[#0055A4] text-white text-[10px] font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center shadow">
                        {inquiryCount}
                      </span>
                    )}
                  </button>
                ) : (
                  <LocaleLink
                    href="/cart"
                    className="relative p-2 text-gray-700 hover:text-[#0055A4] hover:bg-gray-100 rounded-xl transition"
                    aria-label="Cart"
                  >
                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-black rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center shadow">
                        {cartCount}
                      </span>
                    )}
                  </LocaleLink>
                )}

                {/* User Menu */}
                <UserMenu />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          3. FULL MODAL CATALOG DRAWER (OMA.BY / 5ELEMENT STYLE)
          ───────────────────────────────────────────────────────────── */}
      <MegaMenuDrawer
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        categories={categories}
      />

      {/* ─────────────────────────────────────────────────────────────
          4. WHOLESALE RFQ SLIDEOVER
          ───────────────────────────────────────────────────────────── */}
      <WholesaleInquirySlideover
        open={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
      />

      {/* ─────────────────────────────────────────────────────────────
          5. MOBILE SEARCH OVERLAY (ACCORDION)
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-b border-gray-200 px-4 py-3 overflow-hidden shadow-sm"
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={currentPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0055A4]"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          6. MOBILE FULL MENU DRAWER
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 lg:hidden flex"
          >
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="font-black text-[#0055A4] text-lg font-['Outfit',sans-serif]">
                  {companyName}
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Catalog Trigger Button */}
              <div className="p-4 border-b border-gray-100">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setIsCatalogOpen(true)
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#0055A4] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
                >
                  <LayoutGrid className="w-4 h-4 text-amber-300" />
                  <span>{t('catalog' as any) || 'Каталог'}</span>
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <div className="p-4 space-y-1 flex-1">
                {mainNavItems.map((item) => (
                  <LocaleLink
                    key={item.nameKey}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                      item.isSpecial ? 'text-[#0055A4] bg-blue-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t(item.nameKey as any)}
                  </LocaleLink>
                ))}
              </div>

              {/* Mobile Footer Area */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{locale === 'ru' ? 'Язык' : 'Language'}:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => switchLocale('en')}
                      className={`px-2 py-1 rounded text-xs font-bold ${locale === 'en' ? 'bg-[#0055A4] text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => switchLocale('ru')}
                      className={`px-2 py-1 rounded text-xs font-bold ${locale === 'ru' ? 'bg-[#0055A4] text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      RU
                    </button>
                    <button
                      onClick={() => switchLocale('zh')}
                      className={`px-2 py-1 rounded text-xs font-bold ${locale === 'zh' ? 'bg-[#0055A4] text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      ZH
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
