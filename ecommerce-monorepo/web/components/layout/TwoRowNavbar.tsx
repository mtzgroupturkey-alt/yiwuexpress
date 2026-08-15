'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, ClipboardList, User, Menu, X, ChevronDown, Globe } from 'lucide-react'
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
import { routing } from '@/i18n/routing'

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

  const { cartCount } = useCart()
  const { storeMode, isBoth } = useStoreMode()
  const { isWholesaleSession } = useSessionMode()
  const { count: inquiryCount } = useWholesaleInquiry()
  const locale = useLocale()
  const intlRouter = useIntlRouter()
  const pathname = usePathname()
  const nativeRouter = useRouter()
  const t = useTranslations('Header')

  // Switch locale by redirecting to the new locale path
  const switchLocale = (newLocale: string) => {
    // Get the current pathname without the locale prefix
    const currentPath = pathname
    
    // Redirect to the new locale path
    window.location.href = `/${newLocale}${currentPath}`
  }

  const { data: companyData } = useQuery({
    queryKey: ['company'],
    queryFn: () => api.get('/api/company'),
    staleTime: 60 * 60 * 1000,
  })

  const company = companyData?.data

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'menu'],
    queryFn: () => api.get(`/api/categories/menu?includeChildren=true&locale=${locale}`),
    staleTime: 5 * 60 * 1000,
  })

  const categories: Category[] = categoriesData?.data || []

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const mainNavItems = [
    { nameKey: 'nav.home', href: '/' },
    { nameKey: 'nav.products', href: '/products' },
    { nameKey: 'nav.services', href: '/services' },
    { nameKey: 'nav.about', href: '/about' },
    { nameKey: 'nav.contact', href: '/contact' },
    { nameKey: 'nav.wholesale', href: '/wholesale', isSpecial: true },
  ]

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isSticky
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100'
          : 'bg-white border-b border-gray-200 shadow-sm'
      }`}
    >

      {/* ROW 1: ANNOUNCEMENT BAR */}
      <motion.div
        initial={{ height: 'auto', opacity: 1 }}
        animate={{
          height: isSticky ? 0 : 'auto',
          opacity: isSticky ? 0 : 1,
          overflow: 'hidden',
          paddingTop: isSticky ? 0 : 0,
          paddingBottom: isSticky ? 0 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="bg-[#1a3a5c] text-white/80 text-xs px-4 hidden lg:block w-full"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-8">
            <div className="flex items-center space-x-2">
              <span className="text-[#c9a84c] text-sm drop-shadow-lg">✦</span>
              <SimpleTypingText
                texts={[
                  t('announce.welcome'),
                  t('announce.solutions'),
                  t('announce.wholesale'),
                ]}
                typingSpeed={75}
                deletingSpeed={30}
                pauseDuration={2600}
                className="text-white/70 text-[10px] md:text-xs tracking-wider"
              />
            </div>

            <nav className="flex items-center space-x-4 md:space-x-6" aria-label="Main navigation">
              {mainNavItems.map((item) => (
                <LocaleLink
                  key={item.nameKey}
                  href={item.href}
                  className={`text-white/80 hover:text-white text-[10px] md:text-xs font-medium uppercase tracking-wider transition-colors ${
                    item.isSpecial ? 'text-[#c9a84c] hover:text-[#e8d48b]' : ''
                  }`}
                >
                  {t(item.nameKey as any)}
                </LocaleLink>
              ))}
            </nav>
          </div>
        </div>
      </motion.div>

      {/* ROW 2: LOGO + SEARCH + ICONS */}
      <div className="w-full px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* LOGO */}
            <LocaleLink href="/" className="flex items-center gap-2 shrink-0">
              {company?.logo ? (
                <div
                  className="relative"
                  style={{ height: `${company.logoHeight || 40}px`, width: `${(company.logoHeight || 40) * 3}px` }}
                >
                  <Image
                    src={company.logo}
                    alt={company.name || 'Global Trade'}
                    fill
                    priority
                    sizes="(max-width: 768px) 120px, 160px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#c9a84c] to-[#e8d48b] rounded-lg flex items-center justify-center text-[#1a1a2e] font-bold text-sm md:text-base shadow-gold">
                  YE
                </div>
              )}
              <span className="text-xl md:text-2xl font-black text-[#1a3a5c] tracking-tight hidden sm:block" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {company?.name || 'Global Trade'}
              </span>
            </LocaleLink>

            {/* CENTER: Search Bar - Premium */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#c9a84c] transition-colors duration-300" />
                <input
                  type="text"
                  placeholder={t('actions.searchPlaceholder' as any)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent focus:bg-white focus:shadow-premium transition-all duration-300"
                />
              </div>
            </div>

            {/* RIGHT: Icons */}
            <div className="flex items-center gap-1">
              {/* Search (mobile) */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-3 text-gray-500 hover:text-[#c9a84c] hover:bg-gray-100 rounded-full transition-all duration-300"
              >
                <Search className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Language */}
              <div className="relative group hidden md:block">
                <button className="flex items-center gap-1 px-3 py-2 text-xs md:text-sm text-gray-600 hover:text-[#c9a84c] hover:bg-gray-100 rounded-xl transition-all duration-300 font-medium">
                  <Globe className="w-3 h-3 md:w-4 md:h-4" />
                  {locale === 'ru' ? 'RU' : locale === 'zh' ? 'ZH' : 'EN'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-40 bg-white shadow-xl rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                  <button
                    onClick={() => switchLocale('en')}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-[#1a3a5c] hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 rounded-lg transition"
                  >
                    <span className="text-base">🇺🇸</span>
                    <span>{t('lang.en')}</span>
                  </button>
                  <button
                    onClick={() => switchLocale('ru')}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-[#1a3a5c] hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 rounded-lg transition"
                  >
                    <span className="text-base">🇷🇺</span>
                    <span>{t('lang.ru')}</span>
                  </button>
                  <button
                    onClick={() => switchLocale('zh')}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-[#1a3a5c] hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 rounded-lg transition"
                  >
                    <span className="text-base">🇨🇳</span>
                    <span>{t('lang.zh')}</span>
                  </button>
                </div>
              </div>

              {/* Cart / Wholesale inquiry — morphs by admin store mode.
                  WHOLESALE shows the B2B clip-board basket; RETAIL shows the
                  retail cart; BOTH defers to the visitor's session toggle. */}
              {(() => {
                const showWholesaleIcon =
                  storeMode === 'WHOLESALE' ? true : storeMode === 'RETAIL' ? false : isWholesaleSession
                return showWholesaleIcon ? (
                  <button
                    type="button"
                    onClick={() => setIsInquiryOpen(true)}
                    className="relative p-3 text-gray-500 hover:text-[#c9a84c] hover:bg-gray-100 rounded-full transition-all duration-300"
                    aria-label="Wholesale inquiry basket"
                  >
                    <ClipboardList className="w-4 h-4 md:w-5 md:h-5" />
                    {inquiryCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 md:w-5 md:h-5 flex items-center justify-center shadow-lg ring-2 ring-white">
                        {inquiryCount}
                      </span>
                    )}
                  </button>
                ) : (
                  <LocaleLink href="/cart" className="relative p-3 text-gray-500 hover:text-[#c9a84c] hover:bg-gray-100 rounded-full transition-all duration-300">
                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#1a1a2e] text-[10px] font-bold rounded-full w-5 h-5 md:w-5 md:h-5 flex items-center justify-center shadow-gold ring-2 ring-white animate-pulse">
                        {cartCount}
                      </span>
                    )}
                  </LocaleLink>
                )
              })()}

              {/* Account */}
              <UserMenu />

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-3 text-gray-500 hover:text-[#c9a84c] hover:bg-gray-100 rounded-full transition-all duration-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden px-4"
          >
            <div className="py-3 border-t border-gray-100">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#c9a84c] transition-colors duration-300" />
                <input
                  type="text"
                  placeholder={t('actions.searchPlaceholder' as any)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent focus:bg-white focus:shadow-premium transition-all duration-300"
                  autoFocus
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ROW 3: CATEGORY MENU */}
      <div className="w-full bg-[#f8f9fa] border-t border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center space-x-6 flex-wrap h-10 relative">
            <LocaleLink
              href="/products"
              className="text-gray-600 hover:text-[#1a3a5c] text-xs md:text-sm font-medium whitespace-nowrap transition-colors hover:border-b-2 hover:border-[#c9a84c] py-1"
            >
              {t('allProducts')}
            </LocaleLink>

            {categories.map((category) => (
              <div key={category.id} className="relative group h-full flex items-center">
                <LocaleLink
                  href={`/products?category=${category.slug}`}
                  className="text-gray-600 hover:text-[#1a3a5c] text-xs md:text-sm font-medium whitespace-nowrap transition-colors hover:border-b-2 hover:border-[#c9a84c] py-1 flex items-center gap-1"
                >
                  {category.name}
                  {category.children && category.children.length > 0 && (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </LocaleLink>

                {category.children && category.children.length > 0 && (
                  <div className="absolute left-0 top-full bg-white shadow-premium-lg rounded-xl p-4 min-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                    <ul className="space-y-1">
                      {category.children.slice(0, 8).map((sub) => (
                        <li key={sub.id}>
                          <LocaleLink
                            href={`/products?category=${sub.slug}`}
                            className="block px-3 py-2 text-sm text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-50 rounded-lg transition"
                          >
                            {sub.name}
                          </LocaleLink>
                        </li>
                      ))}
                      {category.children.length > 8 && (
                        <li>
                          <LocaleLink
                            href={`/products?category=${category.slug}`}
                            className="block px-3 py-2 text-sm text-[#c9a84c] font-medium hover:bg-gray-50 rounded-lg transition"
                          >
                            {t('viewAll')} →
                          </LocaleLink>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Wholesale Inquiry Slide-over */}
      <WholesaleInquirySlideover
        open={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
      />

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {mainNavItems.map((item) => (
                <LocaleLink
                  key={item.nameKey}
                  href={item.href}
                  className={`block py-2 text-gray-700 hover:text-[#1a3a5c] font-medium border-b border-gray-100 ${
                    item.isSpecial ? 'text-[#c9a84c]' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(item.nameKey as any)}
                </LocaleLink>
              ))}
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
                {categories.map((cat) => (
                  <div key={cat.id} className="border-b border-gray-50">
                    <LocaleLink
                      href={`/products?category=${cat.slug}`}
                      className="block py-2 text-sm text-gray-600 hover:text-[#1a3a5c]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {cat.name}
                    </LocaleLink>
                    {cat.children && cat.children.length > 0 && (
                      <div className="pl-4 pb-2 space-y-1">
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
