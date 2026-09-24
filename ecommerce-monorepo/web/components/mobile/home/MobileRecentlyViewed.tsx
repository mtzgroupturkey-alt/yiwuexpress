'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Product } from '@/app/[locale]/design-3/types'
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter'
import { MobileSectionHeader } from './MobileSectionHeader'
import { MobileProductRow } from './MobileProductRow'

export interface MobileRecentlyViewedProps {
  products?: Product[]
  isLoading?: boolean
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (productId: string) => void
  className?: string
}

export function MobileRecentlyViewed({
  products: initialProducts,
  isLoading: initialLoading = false,
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  className = '',
}: MobileRecentlyViewedProps) {
  const router = useRouter()
  const locale = useLocale()
  const [products, setProducts] = useState<Product[]>(initialProducts || [])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts)
      return
    }

    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('recently_viewed_products')
      if (!stored) {
        setProducts([])
        return
      }

      const ids: string[] = JSON.parse(stored)
      if (!Array.isArray(ids) || ids.length === 0) {
        setProducts([])
        return
      }

      let isMounted = true
      const fetchRecent = async () => {
        try {
          setLoading(true)
          const validIds = ids.slice(0, 10).join(',')
          const res = await fetch(`/api/products?ids=${encodeURIComponent(validIds)}&limit=10&locale=${locale}`)
          if (!res.ok) throw new Error('Failed to fetch recently viewed')
          const json = await res.json()
          if (isMounted && json.data && Array.isArray(json.data)) {
            // Preserve the original order of recently viewed IDs
            const mapped = json.data.map(mapDbProductToDesign3)
            const sorted = ids
              .map((id) => mapped.find((p: Product) => p.id === id))
              .filter(Boolean) as Product[]
            setProducts(sorted)
          }
        } catch (err) {
          console.error('Error loading recently viewed in PWA:', err)
        } finally {
          if (isMounted) setLoading(false)
        }
      }

      fetchRecent()
      return () => {
        isMounted = false
      }
    } catch {
      setProducts([])
    }
  }, [initialProducts, locale])

  // Hide gracefully if user hasn't viewed any products
  if (!loading && products.length === 0) {
    return null
  }

  const title =
    locale === 'zh'
      ? '最近浏览'
      : locale === 'ru'
      ? 'Недавно просмотренные'
      : 'Recently Viewed'

  const subtitle =
    locale === 'zh'
      ? '快速找回您刚刚浏览过的优质好物'
      : locale === 'ru'
      ? 'Быстрый возврат к недавно открытым товарам'
      : 'Quickly revisit products you recently explored'

  return (
    <section
      data-testid="mobile-recently-viewed"
      aria-label={title}
      className={`py-2 ${className}`}
    >
      <MobileSectionHeader
        title={title}
        subtitle={subtitle}
        badge="HISTORY"
      />
      <MobileProductRow
        products={products}
        isLoading={loading}
        onAddToCart={onAddToCart}
        onSelectProduct={onSelectProduct}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
      />
    </section>
  )
}
