'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, ShoppingCart, User, Menu, X, ChevronDown, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { SimpleTypingText } from '@/components/ui/SimpleTypingText'
import { UserMenu } from './UserMenu'
import { useCart } from '@/components/CartContext'

// Types
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
  const [searchQuery, setSearchQuery] = useState('')
  
  // Get real cart count from CartContext
  const { cartCount } = useCart()

  // Fetch company info from database
  const { data: companyData } = useQuery({
    queryKey: ['company'],
    queryFn: () => api.get('/api/company'),
    staleTime: 60 * 60 * 1000, // 1 hour
  })

  const company = companyData?.data

  // Fetch categories with children
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'menu'],
    queryFn: () => api.get('/api/categories/menu?includeChildren=true'),
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

  // Main navigation items
  const mainNavItems = [
    { name: 'HOME', href: '/' },
    { name: 'SHOP', href: '/products' },
    { name: 'SERVICES', href: '/services' },
    { name: 'ABOUT', href: '/about' },
    { name: 'CONTACT', href: '/contact' },
    { name: 'WHOLESALE', href: '/wholesale', isSpecial: true },
  ]

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isSticky
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100'
          : 'bg-white border-b border-gray-200 shadow-sm'
      }`}
    >
      
      {/* ============================================================ */}
      {/* ROW 1: ANNOUNCEMENT BAR + MAIN NAVIGATION                   */}
      {/* ============================================================ */}
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
            {/* Left: Welcome Message with Typing Animation */}
            <div className="flex items-center space-x-2">
              <span className="text-[#c9a84c] text-sm drop-shadow-lg">✦</span>
              <SimpleTypingText
                texts={[
                  `WELCOME TO ${(company?.name || 'YIWU EXPRESS').toUpperCase()} — PREMIUM SOURCING`,
                  "GLOBAL TRADE SOLUTIONS — QUALITY YOU CAN TRUST",
                  "WHOLESALE & RETAIL — BEST PRICES GUARANTEED"
                ]}
                typingSpeed={75}
                deletingSpeed={30}
                pauseDuration={2600}
                className="text-white/70 text-[10px] md:text-xs tracking-wider"
              />
            </div>

            {/* Right: Main Navigation */}
            <nav className="flex items-center space-x-4 md:space-x-6">
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-white/80 hover:text-white text-[10px] md:text-xs font-medium uppercase tracking-wider transition-colors ${
                    item.isSpecial ? 'text-[#c9a84c] hover:text-[#e8d48b]' : ''
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* ROW 2: LOGO + SEARCH + ICONS                               */}
      {/* ============================================================ */}
      <div className="w-full px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* LOGO - Left side */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              {company?.logo ? (
                <Image
                  src={company.logo}
                  alt={company.name || 'YIWU EXPRESS'}
                  width={40}
                  height={40}
                  className="w-8 h-8 md:w-10 md:h-10 object-contain rounded-lg"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#c9a84c] to-[#e8d48b] rounded-lg flex items-center justify-center text-[#1a1a2e] font-bold text-sm md:text-base shadow-md">
                  YE
                </div>
              )}
              <span className="text-base md:text-lg font-bold text-[#1a3a5c] tracking-tight hidden sm:block">
                {company?.name || 'YIWU EXPRESS'}
              </span>
            </Link>

            {/* CENTER: Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent transition"
                />
              </div>
            </div>

            {/* RIGHT: Icons */}
            <div className="flex items-center gap-1">
              {/* Search (mobile) */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-1.5 md:p-2 text-gray-500 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-full transition"
              >
                <Search className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Language */}
              <div className="relative group hidden md:block">
                <button className="flex items-center gap-1 px-2 py-1.5 text-xs md:text-sm text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-lg transition font-medium">
                  <Globe className="w-3 h-3 md:w-4 md:h-4" />
                  EN
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Cart */}
              <Link href="/cart" className="relative p-1.5 md:p-2 text-gray-500 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-full transition">
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center shadow-lg">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Account / User Menu */}
              <UserMenu />

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-1.5 md:p-2 text-gray-500 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-full transition"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar (Expandable) */}
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* ROW 3: CATEGORY MENU WITH SUBMENU                         */}
      {/* ============================================================ */}
      <div className="w-full bg-[#f8f9fa] border-t border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center space-x-6 flex-wrap h-10 relative">
            {/* ALL Link */}
            <Link
              href="/products"
              className="text-gray-600 hover:text-[#1a3a5c] text-xs md:text-sm font-medium whitespace-nowrap transition-colors hover:border-b-2 hover:border-[#c9a84c] py-1"
            >
              ALL
            </Link>

            {/* Categories with Submenus */}
            {categories.map((category) => (
              <div key={category.id} className="relative group h-full flex items-center">
                <Link
                  href={`/products?category=${category.slug}`}
                  className="text-gray-600 hover:text-[#1a3a5c] text-xs md:text-sm font-medium whitespace-nowrap transition-colors hover:border-b-2 hover:border-[#c9a84c] py-1 flex items-center gap-1"
                >
                  {category.name}
                  {category.children && category.children.length > 0 && (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </Link>

                {/* Submenu Dropdown */}
                {category.children && category.children.length > 0 && (
                  <div className="absolute left-0 top-full bg-white shadow-lg rounded-lg p-4 min-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                    <ul className="space-y-1">
                      {category.children.slice(0, 8).map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/products?category=${sub.slug}`}
                            className="block px-3 py-2 text-sm text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-50 rounded-lg transition"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                      {category.children.length > 8 && (
                        <li>
                          <Link
                            href={`/products?category=${category.slug}`}
                            className="block px-3 py-2 text-sm text-[#c9a84c] font-medium hover:bg-gray-50 rounded-lg transition"
                          >
                            View All →
                          </Link>
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

      {/* ============================================================ */}
      {/* MOBILE MENU                                                */}
      {/* ============================================================ */}
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
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block py-2 text-gray-700 hover:text-[#1a3a5c] font-medium border-b border-gray-100 ${
                    item.isSpecial ? 'text-[#c9a84c]' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
                {categories.map((cat) => (
                  <div key={cat.id} className="border-b border-gray-50">
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="block py-2 text-sm text-gray-600 hover:text-[#1a3a5c]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                    {cat.children && cat.children.length > 0 && (
                      <div className="pl-4 pb-2 space-y-1">
                        {cat.children.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/products?category=${sub.slug}`}
                            className="block py-1 text-xs text-gray-500 hover:text-[#1a3a5c]"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
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