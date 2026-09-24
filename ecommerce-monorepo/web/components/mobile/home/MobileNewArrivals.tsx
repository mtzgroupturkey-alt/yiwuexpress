'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Product } from '@/app/[locale]/design-3/types'
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter'
import { MobileSectionHeader } from './MobileSectionHeader'
import { MobileProductRow } from './MobileProductRow'

export interface MobileNewArrivalsProps {
  products?: Product[]
  isLoading?: boolean
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (productId: string) => void
  onViewAll?: () => void
  className?: string
}

export function MobileNewArrivals({
  products: initialProducts,
  isLoading: initialLoading = false,
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  onViewAll,
  className = '',
}: MobileNewArrivalsProps) {
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
    const fetchNewArrivals = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/new-arrivals?limit=8&locale=${locale}`)
        if (!res.ok) throw new Error('Failed to fetch new arrivals')
        const json = await res.json()
        if (isMounted && json.success && Array.isArray(json.data)) {
          setProducts(json.data.map(mapDbProductToDesign3))
        }
      } catch (err) {
        console.error('Error loading new arrivals in PWA:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchNewArrivals()
    return () => {
      isMounted = false
    }
  }, [initialProducts, locale])

  if (!loading && products.length === 0) {
    return null
  }

  const title =
    locale === 'zh'
      ? '新品首发'
      : locale === 'ru'
      ? 'Новые поступления'
      : 'New Arrivals'

  const subtitle =
    locale === 'zh'
      ? '源头工厂每日上新 · 现货保障'
      : locale === 'ru'
      ? 'Свежие товары напрямую от проверенных фабрик'
      : 'Fresh from verified source manufacturers'

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll()
    } else {
      router.push(`/${locale}/store?sort=newest`)
    }
  }

  return (
    <section
      data-testid="mobile-new-arrivals"
      aria-label={title}
      className={`py-2 ${className}`}
    >
      <MobileSectionHeader
        title={title}
        subtitle={subtitle}
        badge="NEW"
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
