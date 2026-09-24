'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Product } from '@/app/[locale]/design-3/types'
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter'
import { MobileSectionHeader } from './MobileSectionHeader'
import { MobileProductRow } from './MobileProductRow'

export interface MobileTrendingProductsProps {
  products?: Product[]
  isLoading?: boolean
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (productId: string) => void
  onViewAll?: () => void
  className?: string
}

export function MobileTrendingProducts({
  products: initialProducts,
  isLoading: initialLoading = false,
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  onViewAll,
  className = '',
}: MobileTrendingProductsProps) {
  const router = useRouter()
  const locale = useLocale()
  const [products, setProducts] = useState<Product[]>(initialProducts || [])
  const [loading, setLoading] = useState<boolean>(!initialProducts && !initialLoading)

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts)
      setLoading(false)
      return
    }

    let isMounted = true
    const fetchTrending = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/trending?limit=8&locale=${locale}`)
        if (!res.ok) throw new Error('Failed to fetch trending products')
        const json = await res.json()
        if (isMounted && json.success && Array.isArray(json.data)) {
          setProducts(json.data.map(mapDbProductToDesign3))
        }
      } catch (err) {
        console.error('Error loading trending products in PWA:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchTrending()
    return () => {
      isMounted = false
    }
  }, [initialProducts, locale])

  if (!loading && products.length === 0) {
    return null
  }

  const title =
    locale === 'zh'
      ? '当季热门'
      : locale === 'ru'
      ? 'В тренде сейчас'
      : 'Trending Now'

  const subtitle =
    locale === 'zh'
      ? '全网热销 · 采购商高频关注'
      : locale === 'ru'
      ? 'Самые просматриваемые товары этой недели'
      : 'Most viewed and searched items this week'

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll()
    } else {
      router.push(`/${locale}/store?sort=popularity`)
    }
  }

  return (
    <section
      data-testid="mobile-trending-products"
      aria-label={title}
      className={`py-2 ${className}`}
    >
      <MobileSectionHeader
        title={title}
        subtitle={subtitle}
        badge="HOT"
        onViewAll={handleViewAll}
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
