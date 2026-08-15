'use client'

import Link from 'next/link'
import { LocaleLink } from '@/components/LocaleLink'
import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown, Globe } from 'lucide-react'
import { topMenuItems, staticCategories } from '@/lib/menu-config'
import { useRouter as useIntlRouter, usePathname } from '@/i18n/navigation'

interface MobileMenuProps {
  onClose: () => void
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const locale = useLocale()
  const intlRouter = useIntlRouter()
  const pathname = usePathname()
  const t = useTranslations('Header')

  // Prefer localized categories from the API (per active website language),
  // falling back to the static config if the request fails.
  const [categories, setCategories] = useState(staticCategories)
  useEffect(() => {
    let cancelled = false
    fetch(`/api/categories/menu?includeChildren=true&locale=${locale}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.data?.length) setCategories(data.data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [locale])

  return (
    <div className="space-y-4">
      {/* Top Menu - Static Pages */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Main Menu
        </h3>
        {topMenuItems.map((item) => (
          <LocaleLink
            key={item.name}
            href={item.path}
            className="block py-3 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-50 font-medium rounded px-3 transition-colors"
            onClick={onClose}
          >
            {item.name}
          </LocaleLink>
        ))}
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Product Categories
        </h3>
        
        {/* ALL Products Link */}
        <LocaleLink
          href="/products"
          className="block py-3 text-gray-700 hover:text-[#1a3a5c] hover:bg-gray-50 font-medium rounded px-3 transition-colors mb-2"
          onClick={onClose}
        >
          {t('allProducts')}
        </LocaleLink>

        {/* Category List */}
        {categories.map((category) => (
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
                    <LocaleLink
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
                    </LocaleLink>
                  </li>
                ))}
                <li className="pt-2">
                  <LocaleLink
                    href={`/products?category=${category.slug}`}
                    className="text-sm text-[#c9a84c] font-medium hover:underline block py-2 px-3"
                    onClick={onClose}
                  >
                    {t('viewAll')} {category.name} â†’
                  </LocaleLink>
                </li>
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Language */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" /> Language
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              window.location.href = `/en${pathname}`
              onClose()
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              locale === 'en' ? 'border-[#c9a84c] text-[#1a3a5c] bg-[#c9a84c]/10' : 'border-gray-200 text-gray-600'
            }`}
          >
            <span>🇺🇸</span> EN
          </button>
          <button
            onClick={() => {
              window.location.href = `/ru${pathname}`
              onClose()
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              locale === 'ru' ? 'border-[#c9a84c] text-[#1a3a5c] bg-[#c9a84c]/10' : 'border-gray-200 text-gray-600'
            }`}
          >
            <span>🇷🇺</span> RU
          </button>
          <button
            onClick={() => {
              window.location.href = `/zh${pathname}`
              onClose()
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              locale === 'zh' ? 'border-[#c9a84c] text-[#1a3a5c] bg-[#c9a84c]/10' : 'border-gray-200 text-gray-600'
            }`}
          >
            <span>🇨🇳</span> ZH
          </button>
        </div>
      </div>

      {/* Wholesale CTA */}
      <div className="pt-4 border-t border-gray-200">
        <LocaleLink
          href="/wholesale"
          className="block bg-gradient-to-r from-[#1a3a5c] to-[#2a4a6c] text-white text-center py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          onClick={onClose}
        >
          💼 Wholesale Inquiries
        </LocaleLink>
      </div>
    </div>
  )
}
