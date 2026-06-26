'use client'

import Link from 'next/link'
import { staticCategories } from '@/lib/menu-config'

export function MegaMenu() {
  return (
    <div className="absolute left-0 right-0 top-full bg-white shadow-lg border-t border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-5 gap-6">
          {staticCategories.slice(0, 5).map((category) => (
            <div key={category.id}>
              <Link
                href={`/products?category=${category.slug}`}
                className="block font-semibold text-[#1a3a5c] mb-3 hover:text-[#c9a84c] text-sm uppercase tracking-wider transition-colors"
              >
                {category.name}
              </Link>
              <ul className="space-y-2">
                {category.children?.slice(0, 8).map((subCategory) => (
                  <li key={subCategory.id}>
                    <Link
                      href={`/products?category=${subCategory.slug}`}
                      className="text-sm text-gray-600 hover:text-[#1a3a5c] transition-colors block"
                    >
                      {subCategory.name}
                      {subCategory.productCount !== undefined && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({subCategory.productCount})
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
                {category.children && category.children.length > 8 && (
                  <li>
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="text-sm text-[#c9a84c] font-medium hover:underline"
                    >
                      View All →
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Promotional Banner */}
        <div className="mt-8 bg-gradient-to-r from-[#1a3a5c] to-[#2a4a6c] rounded-lg p-6 text-white flex items-center justify-between">
          <div>
            <span className="font-bold text-lg">💼 WHOLESALE INQUIRIES</span>
            <p className="text-sm opacity-90 mt-1">Bulk orders & custom sourcing from Yiwu Market</p>
          </div>
          <Link
            href="/wholesale"
            className="bg-[#c9a84c] text-[#1a3a5c] px-6 py-3 rounded-lg font-semibold hover:bg-[#d4b563] transition-colors shadow-lg"
          >
            Get Quote
          </Link>
        </div>
      </div>
    </div>
  )
}
