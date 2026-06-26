'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Truck, User, Menu, X, MapPin, Phone, Globe, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import MegaMenu from '@/components/MegaMenu'

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('YIWU EXPRESS')
  const [primaryColor, setPrimaryColor] = useState('#1a3a5c')
  const [accentColor, setAccentColor] = useState('#c9a84c')
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)

    // Fetch cart count if logged in
    if (token) {
      fetchCartCount()
    }

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

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    window.location.href = '/login'
  }

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const userId = JSON.parse(atob(token.split('.')[1])).userId
      const response = await fetch(`/api/cart?userId=${userId}`)
      const data = await response.json()
      
      if (data.success && data.data.summary) {
        setCartItemCount(data.data.summary.itemCount || 0)
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/services', label: 'Services' },
    { href: '/track', label: 'Track Shipment' },
    { href: '/quotes', label: 'Get Quote' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav className={`sticky top-0 z-[60] transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'
    }`}>
      {/* Top Bar */}
      <div className="text-white py-2 bg-primary">
        <Container maxWidth="2xl">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Yiwu International Trade City, Zhejiang, China</span>
                <span className="sm:hidden">Yiwu, China</span>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+86 579 8555 1234</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 transition-colors hover-accent">
                <Globe className="w-4 h-4" />
                <span>EN</span>
              </button>
              <Link href="/track" className="hidden sm:inline transition-colors hover-accent">
                Track Shipment
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Navigation */}
      <Container maxWidth="2xl">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${companyName} Logo`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src="/logo.svg"
                  alt="YIWU EXPRESS Logo"
                  fill
                  className="object-contain"
                />
              )}
            </div>
            <div className="hidden md:block">
              <div className="text-xl font-bold text-gray-900">{companyName}</div>
              <div className="text-xs text-gray-500">Global Trade Solutions from Yiwu, China</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              href="/"
              className="text-gray-700 font-medium transition-colors hover-primary px-3 py-2"
            >
              Home
            </Link>
            <MegaMenu />
            {navItems.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 font-medium transition-colors hover-primary px-3 py-2"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon with Badge */}
            <Link href="/cart" className="relative p-2 text-gray-700 transition-colors hover-primary">
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </Link>

            <button className="relative p-2 text-gray-700 transition-colors hover-primary">
              <Truck className="w-6 h-6" />
            </button>

            {isLoggedIn ? (
              <div className="relative group">
                <button className="p-2 text-gray-700 transition-colors hover-primary">
                  <User className="w-6 h-6" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50"
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50"
                  >
                    Business Profile
                  </Link>
                  <Link
                    href="/quotes"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50"
                  >
                    My Quotes
                  </Link>
                  <Link
                    href="/shipments"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50"
                  >
                    My Shipments
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 font-medium transition-colors hover-primary"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-white rounded-lg font-medium shadow-lg transition-all btn-primary"
                >
                  Register Business
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-700 font-medium py-2 transition-colors hover-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              {/* Mobile Categories */}
              <div className="border-t border-gray-100 pt-2">
                <div className="text-sm font-semibold text-gray-500 uppercase mb-2">Shop by Category</div>
                <Link
                  href="/products"
                  className="block text-gray-700 font-medium py-2 transition-colors hover-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  All Products
                </Link>
              </div>
              
              {navItems.slice(1).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 font-medium py-2 transition-colors hover-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              {!isLoggedIn && (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 font-medium py-2 transition-colors hover-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-white rounded-lg font-medium text-center shadow-lg btn-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register Business
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </Container>
    </nav>
  )
}