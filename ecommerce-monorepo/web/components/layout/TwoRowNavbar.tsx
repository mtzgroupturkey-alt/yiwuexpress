'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, User, Menu as MenuIcon, X } from 'lucide-react'
import { MegaMenu } from './MegaMenu'
import { CategoryMenu } from './CategoryMenu'
import { MobileMenu } from './MobileMenu'
import { topMenuItems } from '@/lib/menu-config'

export function TwoRowNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [cartCount, setCartCount] = useState(3) // This should come from your cart state

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* ============================================================ */}
      {/* ROW 1: TOP MENU - Static Pages ONLY                          */}
      {/* ============================================================ */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 shrink-0">
              <div className="w-10 h-10 bg-[#1a3a5c] rounded flex items-center justify-center text-white font-bold text-sm">
                YE
              </div>
              <span className="text-xl font-bold text-[#1a3a5c] hidden sm:block">
                YIWU EXPRESS
              </span>
            </Link>

            {/* Desktop Top Menu - Static Pages */}
            <nav className="hidden lg:flex items-center space-x-1">
              {topMenuItems.map((item) => (
                <div key={item.name} className="relative group">
                  <Link
                    href={item.path}
                    className="text-gray-700 hover:text-[#1a3a5c] font-medium text-sm uppercase tracking-wider transition-colors px-4 py-2 rounded hover:bg-gray-50 flex items-center gap-1"
                  >
                    {item.name}
                    {item.hasDropdown && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>
                  {item.hasDropdown && <MegaMenu />}
                </div>
              ))}
            </nav>

            {/* Right Utilities - Search, Cart, Account */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <button
                className="text-gray-600 hover:text-[#1a3a5c] p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="text-gray-600 hover:text-[#1a3a5c] p-2 rounded-full hover:bg-gray-100 relative transition-colors"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              <Link
                href="/login"
                className="text-gray-600 hover:text-[#1a3a5c] p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Account"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden text-gray-600 hover:text-[#1a3a5c] p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Search Bar (expandable) */}
          {isSearchOpen && (
            <div className="py-4 border-t border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ROW 2: CATEGORY MENU - Products ONLY                        */}
      {/* ============================================================ */}
      <div className="hidden lg:block bg-white">
        <div className="container mx-auto px-4">
          <CategoryMenu />
        </div>
      </div>

      {/* ============================================================ */}
      {/* MOBILE MENU                                                  */}
      {/* ============================================================ */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="container mx-auto px-4 py-4">
            <MobileMenu onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  )
}
