'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Product } from '@/app/[locale]/design-3/types'
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter'
import { MobileSectionHeader } from './MobileSectionHeader'
import { MobileProductRow } from './MobileProductRow'

export interface MobileDealsOfTheDayProps {
  products?: Product[]
  isLoading?: boolean
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (productId: string) => void
  onViewAll?: () => void
  className?: string
}

export function MobileDealsOfTheDay({
  products: initialProducts,
  isLoading: initialLoading = false,
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  onViewAll,
  className = '',
}: MobileDealsOfTheDayProps) {
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
    const fetchDeals = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/deals-of-the-day?limit=8&locale=${locale}`)
        if (!res.ok) throw new Error('Failed to fetch deals of the day')
        const json = await res.json()
        if (isMounted && json.success && Array.isArray(json.data)) {
          setProducts(json.data.map(mapDbProductToDesign3))
        }
      } catch (err) {
        console.error('Error loading deals of the day in PWA:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchDeals()
    return () => {
      isMounted = false
    }
  }, [initialProducts, locale])

  if (!loading && products.length === 0) {
    return null
  }

  const title =
    locale === 'zh'
      ? '今日特惠'
      : locale === 'ru'
      ? 'Предложения дня'
      : 'Deals of the Day'

  const subtitle =
    locale === 'zh'
      ? '今日专享好价 · 高性价比清仓特供'
      : locale === 'ru'
      ? 'Специальные цены и выгодные предложения на сегодня'
      : 'Special wholesale & retail discounts updated daily'

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll()
    } else {
      router.push(`/${locale}/store?filter=deals`)
    }
  }

  return (
    <section
      data-testid="mobile-deals-of-the-day"
      aria-label={title}
      className={`py-2 ${className}`}
    >
      <MobileSectionHeader
        title={title}
        subtitle={subtitle}
        badge="DEALS"
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
