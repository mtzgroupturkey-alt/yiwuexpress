'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Truck, User, Menu, X, MapPin, Phone, Globe } from 'lucide-react'
import Image from 'next/image'

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('YIWU EXPRESS')

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)

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

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/track', label: 'Track Shipment' },
    { href: '/quotes', label: 'Get Quote' },
    { href: '/network', label: 'Global Network' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'
    }`}>
      {/* Top Bar */}
      <div className="bg-primary-600 text-white py-2 px-4">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Yiwu International Trade City, Zhejiang, China</span>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>+86 579 8555 1234</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 hover:text-secondary-400 transition-colors">
              <Globe className="w-4 h-4" />
              <span>EN</span>
            </button>
            <Link href="/track" className="hover:text-secondary-400 transition-colors">
              Track Shipment
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4">
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
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-700 hover:text-primary-600">
              <Truck className="w-6 h-6" />
            </button>

            {isLoggedIn ? (
              <div className="relative group">
                <button className="p-2 text-gray-700 hover:text-primary-600">
                  <User className="w-6 h-6" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block">
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
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-brand hover:shadow-brand-lg transition-all"
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
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-600 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              {!isLoggedIn && (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-primary-600 font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-center shadow-brand"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register Business
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}