'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Truck, User, Menu, X, Search, ShoppingCart, ChevronDown, Package, Headphones, FileText } from 'lucide-react'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import MegaMenu from '@/components/MegaMenu'
import { UserMenu } from '@/components/layout/UserMenu'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/components/CartContext'

export default function Navbar() {
  const { isAuthenticated, checkAuth } = useAuth()
  const { cartCount } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('YIWU EXPRESS')
  const [primaryColor, setPrimaryColor] = useState('#1a3a5c')
  const [accentColor, setAccentColor] = useState('#c9a84c')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // ✅ Check authentication using useAuth hook
    checkAuth()

    // ✅ Re-check auth every 30 seconds to catch login in other tabs
    const authCheckInterval = setInterval(() => {
      checkAuth()
    }, 30000)

    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    
    // Fetch settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          if (data.settings.companyLogo) setLogoUrl(data.settings.companyLogo)
          if (data.settings.companyName) setCompanyName(data.settings.companyName)
          if (data.settings.primaryColor) {
            setPrimaryColor(data.settings.primaryColor)
            document.documentElement.style.setProperty('--primary-color', data.settings.primaryColor)
          }
          if (data.settings.accentColor) {
            setAccentColor(data.settings.accentColor)
            document.documentElement.style.setProperty('--accent-color', data.settings.accentColor)
          }
        }
      })
      .catch(err => console.error(err))

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearInterval(authCheckInterval)
    }
  }, [])

  // Auto-focus search input when expanded
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchExpanded])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
    }
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services', hasDropdown: true },
    { href: '/track', label: 'Track Shipment', icon: Package },
    { href: '/quotes', label: 'Get Quote', icon: FileText },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact', icon: Headphones },
  ]

  return (
    <nav className={`sticky top-0 z-[60] transition-all duration-500 ${
      scrolled 
        ? 'bg-white/98 backdrop-blur-xl shadow-[0_8px_32px_rgba(26,58,92,0.12)]' 
        : 'bg-white shadow-sm'
    }`}>
      {/* Main Navigation - Premium Design */}
      <Container maxWidth="2xl">
        <div className="flex justify-between items-center h-20 relative">
          {/* Logo with Premium Gradient Icon */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a3a5c] via-[#2a5a8c] to-[#1a3a5c] flex items-center justify-center shadow-lg shadow-[#1a3a5c]/30 ring-2 ring-[#c9a84c]/20 group-hover:ring-[#c9a84c]/40 transition-all duration-300 group-hover:scale-105">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${companyName} Logo`}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="text-white font-bold text-lg">YE</div>
              )}
            </div>
            <div className="hidden md:block">
              <div className="text-xl font-bold bg-gradient-to-r from-[#1a3a5c] to-[#2a5a8c] bg-clip-text text-transparent group-hover:from-[#c9a84c] group-hover:to-[#1a3a5c] transition-all duration-300">
                {companyName}
              </div>
              <div className="text-[10px] text-gray-500 font-medium tracking-wide">Global Trade Solutions</div>
            </div>
          </Link>

          {/* Center Navigation - Premium with Hover Effects */}
          <div className="hidden lg:flex items-center space-x-1 absolute left-1/2 -translate-x-1/2">
            <Link
              href="/"
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#1a3a5c] transition-all duration-300 relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c9a84c] to-[#1a3a5c] group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            <MegaMenu />
            
            {navItems.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#1a3a5c] transition-all duration-300 relative group flex items-center gap-1.5"
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
                {item.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c9a84c] to-[#1a3a5c] group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          {/* Right Actions - Search, Cart, Account, Language, Currency */}
          <div className="flex items-center space-x-2">
            {/* Expandable Search Bar */}
            <div className={`relative transition-all duration-500 ${
              searchExpanded ? 'w-64' : 'w-10'
            }`}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className={`w-full h-10 pl-10 pr-4 rounded-full border-2 transition-all duration-500 ${
                    searchExpanded 
                      ? 'border-[#c9a84c] bg-white shadow-lg opacity-100' 
                      : 'border-transparent bg-gray-100 opacity-0 pointer-events-none'
                  } focus:outline-none focus:border-[#c9a84c] text-sm`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchExpanded(!searchExpanded)
                    if (searchExpanded) {
                      setSearchQuery('')
                    }
                  }}
                  className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 hover:from-[#c9a84c]/20 hover:to-[#1a3a5c]/20 flex items-center justify-center transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-[#c9a84c]/30"
                >
                  <Search className="w-4.5 h-4.5 text-gray-600" />
                </button>
              </form>
            </div>

            {/* Language Selector - Hidden on mobile */}
            <div className="relative group hidden md:block">
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-full transition-all duration-300">
                <span className="text-base">🇺🇸</span>
                <span className="text-xs">EN</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {/* Language Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-36 bg-white shadow-xl rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-[#1a3a5c] hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 rounded-lg transition">
                  <span className="text-base">🇺🇸</span>
                  <span>English</span>
                </button>
                <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-[#1a3a5c] hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 rounded-lg transition">
                  <span className="text-base">🇷🇺</span>
                  <span>Russian</span>
                </button>
                <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-[#1a3a5c] hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 rounded-lg transition">
                  <span className="text-base">🇨🇳</span>
                  <span>Chinese</span>
                </button>
              </div>
            </div>

            {/* Currency Selector - Hidden on mobile */}
            <div className="relative group hidden md:block">
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-full transition-all duration-300">
                <span className="text-base">💰</span>
                <span className="text-xs">USD</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {/* Currency Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-32 bg-white shadow-xl rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-[#1a3a5c] hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 rounded-lg transition">
                  <span className="text-base">💰</span>
                  <span>USD</span>
                </button>
                <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-[#1a3a5c] hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 rounded-lg transition">
                  <span className="text-base">₽</span>
                  <span>RUB</span>
                </button>
                <button className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-[#1a3a5c] hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 rounded-lg transition">
                  <span className="text-base">€</span>
                  <span>EUR</span>
                </button>
              </div>
            </div>

            {/* Cart Icon with Animated Badge */}
            <Link 
              href="/cart" 
              className="relative w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 hover:from-[#c9a84c]/20 hover:to-[#1a3a5c]/20 flex items-center justify-center transition-all duration-300 hover:scale-105 group border-2 border-transparent hover:border-[#c9a84c]/30"
            >
              <ShoppingCart className="w-4.5 h-4.5 text-gray-700 group-hover:text-[#1a3a5c]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse ring-2 ring-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* ✅ User Menu Component - Uses useAuth hook */}
            <div className="hidden md:block">
              <UserMenu />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 hover:from-[#c9a84c]/20 hover:to-[#1a3a5c]/20 flex items-center justify-center transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-[#c9a84c]/30"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile menu - Premium Design */}
        {isMenuOpen && (
          <div className="lg:hidden py-6 border-t border-gray-100 animate-slideDown">
            <div className="flex flex-col space-y-1">
              {/* Mobile Search */}
              <div className="px-4 pb-4">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full h-11 pl-11 pr-4 rounded-xl border-2 border-gray-200 focus:border-[#c9a84c] focus:outline-none text-sm transition-all duration-300"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                </form>
              </div>
              
              <Link
                href="/"
                className="px-4 py-3 text-gray-700 font-semibold text-sm hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 transition-all duration-200 rounded-lg mx-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              <Link
                href="/products"
                className="px-4 py-3 text-gray-700 font-semibold text-sm hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 transition-all duration-200 rounded-lg mx-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              
              {navItems.slice(1).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 font-semibold text-sm hover:bg-gradient-to-r hover:from-[#c9a84c]/10 hover:to-[#1a3a5c]/10 transition-all duration-200 rounded-lg mx-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon && <item.icon className="w-4 h-4 text-[#1a3a5c]" />}
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile Language & Currency */}
              <div className="px-4 pt-4 space-y-2 border-t border-gray-100 mt-2">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Preferences</div>
                
                {/* Language Selection */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs font-medium text-gray-600 mb-2">Language</div>
                  <div className="flex flex-wrap gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-[#c9a84c] text-gray-700 rounded-lg text-sm font-medium">
                      <span>🇺🇸</span> English
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:border-gray-300">
                      <span>🇷🇺</span> Russian
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:border-gray-300">
                      <span>🇨🇳</span> Chinese
                    </button>
                  </div>
                </div>
                
                {/* Currency Selection */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs font-medium text-gray-600 mb-2">Currency</div>
                  <div className="flex flex-wrap gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-[#c9a84c] text-gray-700 rounded-lg text-sm font-medium">
                      <span>💰</span> USD
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:border-gray-300">
                      <span>₽</span> RUB
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:border-gray-300">
                      <span>€</span> EUR
                    </button>
                  </div>
                </div>
              </div>
              
              {/* ✅ Mobile Auth Buttons */}
              <div className="px-4 pt-4 border-t border-gray-100 mt-2">
                <UserMenu />
              </div>
            </div>
          </div>
        )}
      </Container>
    </nav>
  )
}