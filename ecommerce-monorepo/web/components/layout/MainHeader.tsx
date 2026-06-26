'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search, User, ShoppingCart, Menu } from 'lucide-react'
import { useState } from 'react'
import { MobileMenu } from './MobileMenu'
import { Container } from '@/components/ui/Container'
import { useSettings } from '@/components/SettingsProvider'

export function MainHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartCount] = useState(3) // This should come from your cart state
  const { settings } = useSettings()

  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <Container>
        <div className="flex items-center justify-between">
          {/* Left: Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-gray-600 hover:text-[#1a3a5c] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo - Centered */}
          <Link href="/" className="flex items-center space-x-3">
            {settings?.companyLogo ? (
              <div 
                className="relative flex-shrink-0" 
                style={{ 
                  width: `${settings?.companyLogoHeight || 40}px`, 
                  height: `${settings?.companyLogoHeight || 40}px` 
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
                className="bg-[#1a3a5c] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ 
                  width: `${settings?.companyLogoHeight || 40}px`, 
                  height: `${settings?.companyLogoHeight || 40}px` 
                }}
              >
                {settings?.companyName?.substring(0, 2).toUpperCase() || 'YE'}
              </div>
            )}
            <span 
              className="text-2xl font-bold tracking-tight"
              style={{ color: settings?.primaryColor || '#1a3a5c' }}
            >
              {settings?.companyName || 'YIWU EXPRESS'}
            </span>
          </Link>

          {/* Right: Search + Warranty + Icons */}
          <div className="flex items-center space-x-4">
            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex items-center border border-gray-300 rounded-full px-4 py-1.5 w-64">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for kitchenware..."
                className="w-full px-3 py-1 text-sm outline-none bg-transparent"
              />
            </div>

            {/* Warranty Registration - Desktop */}
            <Link
              href="/warranty"
              className="hidden lg:block text-xs text-gray-600 hover:text-[#1a3a5c] font-medium transition-colors"
            >
              Warranty Registration
            </Link>

            {/* Icons */}
            <button className="text-gray-600 hover:text-[#1a3a5c] p-2 lg:hidden transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link href="/account" className="text-gray-600 hover:text-[#1a3a5c] p-2 transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/cart" className="text-gray-600 hover:text-[#1a3a5c] p-2 relative transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden mt-3 flex items-center border border-gray-300 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for kitchenware..."
            className="w-full px-3 py-1 text-sm outline-none bg-transparent"
          />
        </div>
      </Container>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 mt-4">
          <Container className="py-4">
            <MobileMenu onClose={() => setIsMobileMenuOpen(false)} />
          </Container>
        </div>
      )}
    </header>
  )
}
