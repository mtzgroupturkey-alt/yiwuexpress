'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { topMenuItems, staticCategories } from '@/lib/menu-config'

interface MobileMenuProps {
  onClose: () => void
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {/* Top Menu - Static Pages */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Main Menu
        </h3>
        {topMenuItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className="block py-3 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-50 font-medium rounded px-3 transition-colors"
            onClick={onClose}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Product Categories
        </h3>
        
        {/* ALL Products Link */}
        <Link
          href="/products"
          className="block py-3 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-50 font-medium rounded px-3 transition-colors mb-2"
          onClick={onClose}
        >
          ALL PRODUCTS
        </Link>

        {/* Category List */}
        {staticCategories.map((category) => (
          <div key={category.id} className="border-b border-gray-100">
            <button
              className="flex items-center justify-between w-full py-3 px-3 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-50 font-medium rounded transition-colors"
              onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
            >
              <span className="flex items-center gap-2">
                {category.name}
                <span className="text-xs text-gray-400">
                  ({category.productCount})
                </span>
              </span>
              {category.children && category.children.length > 0 && (
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openCategory === category.id ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>
            
            {openCategory === category.id && category.children && category.children.length > 0 && (
              <ul className="pl-6 pb-3 space-y-1">
                {category.children.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={`/products?category=${sub.slug}`}
                      className="text-sm text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-50 block py-2 px-3 rounded transition-colors"
                      onClick={onClose}
                    >
                      {sub.name}
                      {sub.productCount && (
                        <span className="text-xs text-gray-400 ml-2">
                          ({sub.productCount})
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="text-sm text-[#c9a84c] font-medium hover:underline block py-2 px-3"
                    onClick={onClose}
                  >
                    View All {category.name} →
                  </Link>
                </li>
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Wholesale CTA */}
      <div className="pt-4 border-t border-gray-200">
        <Link
          href="/wholesale"
          className="block bg-gradient-to-r from-[#1a3a5c] to-[#2a4a6c] text-white text-center py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          onClick={onClose}
        >
          💼 Wholesale Inquiries
        </Link>
      </div>
    </div>
  )
}
