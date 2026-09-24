'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Product } from '@/app/[locale]/design-3/types'
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter'
import { MobileSectionHeader } from './MobileSectionHeader'
import { MobileProductRow } from './MobileProductRow'

export interface MobileRecommendedForYouProps {
  products?: Product[]
  isLoading?: boolean
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (productId: string) => void
  onViewAll?: () => void
  className?: string
}

export function MobileRecommendedForYou({
  products: initialProducts,
  isLoading: initialLoading = false,
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  onViewAll,
  className = '',
}: MobileRecommendedForYouProps) {
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

    if (typeof window === 'undefined') return

    let isMounted = true
    const fetchRecommended = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/recommended?limit=6&locale=${locale}`)
        if (!res.ok) throw new Error('Failed to fetch recommended products')
        const json = await res.json()
        if (isMounted && json.success && Array.isArray(json.data)) {
          setProducts(json.data.map(mapDbProductToDesign3))
        }
      } catch (err) {
        console.error('Error loading recommended products in PWA:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchRecommended()
    return () => {
      isMounted = false
    }
  }, [initialProducts, locale])

  if (!loading && products.length === 0) {
    return null
  }

  const title =
    locale === 'zh'
      ? '为你推荐'
      : locale === 'ru'
      ? 'Рекомендуем вам'
      : 'Recommended For You'

  const subtitle =
    locale === 'zh'
      ? '猜你喜欢 · 平台高分优选商品'
      : locale === 'ru'
      ? 'Персональные рекомендации качественных фабричных товаров'
      : 'Curated suggestions matched to global buying trends'

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll()
    } else {
      router.push(`/${locale}/store`)
    }
  }

  return (
    <section
      data-testid="mobile-recommended-for-you"
      aria-label={title}
      className={`py-2 ${className}`}
    >
      <MobileSectionHeader
        title={title}
        subtitle={subtitle}
        badge="FOR YOU"
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
