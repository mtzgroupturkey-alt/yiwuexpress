'use client'

import React from 'react'
import { Product, Category } from '@/app/[locale]/design-3/types'
import { MobileHero } from './MobileHero'
import { MobileCategoryRow } from './MobileCategoryRow'
import { MobileFlashDeals } from './MobileFlashDeals'
import { MobileBestsellersGrid } from './MobileBestsellersGrid'
import { MobileBrandStrip } from './MobileBrandStrip'
import { MobilePromoBanner } from './MobilePromoBanner'
import { MobileNewsletterCard } from './MobileNewsletterCard'

export interface MobileHomePageProps {
  products: Product[]
  categories: Category[]
  flashDeals: Product[]
  flashDealsEndDate?: string | null
  flashDealsTitle?: string
  bestSellers: Product[]
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (productId: string) => void
  onNavigateView?: (view: any, params?: any) => void
  className?: string
}

export function MobileHomePage({
  products,
  categories,
  flashDeals,
  flashDealsEndDate,
  flashDealsTitle,
  bestSellers,
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  onNavigateView,
  className = '',
}: MobileHomePageProps) {
  return (
    <div
      data-testid="mobile-home-page"
      className={`md:hidden flex flex-col space-y-4 pb-6 ${className}`}
    >
      {/* 1. Mobile Hero Carousel */}
      <MobileHero
        onShopNow={() => onNavigateView?.('shop')}
      />

      {/* 2. Mobile Category Row */}
      <MobileCategoryRow
        categories={categories && categories.length > 0 ? categories : undefined}
        onSelectCategory={(cat) => {
          if (typeof cat === 'string') {
            onNavigateView?.('shop', { category: cat })
          } else {
            onNavigateView?.('shop', { category: cat.slug || cat.id })
          }
        }}
      />

      {/* 3. Mobile Flash Deals */}
      <MobileFlashDeals
        deals={flashDeals || []}
        endDate={flashDealsEndDate}
        title={flashDealsTitle}
        onAddToCart={onAddToCart}
        onSelectProduct={onSelectProduct}
        onViewAll={() => onNavigateView?.('shop', { filter: 'deals' })}
      />

      {/* 4. Promotional Banner Card */}
      <MobilePromoBanner
        onAction={() => onNavigateView?.('wholesale')}
      />

      {/* 5. Mobile Best Sellers Grid */}
      <MobileBestsellersGrid
        products={bestSellers}
        onAddToCart={onAddToCart}
        onSelectProduct={onSelectProduct}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onViewAll={() => onNavigateView?.('shop')}
      />

      {/* 6. Verified Factory & Brand Strip */}
      <MobileBrandStrip />

      {/* 7. Newsletter Subscription Card */}
      <MobileNewsletterCard />
    </div>
  )
}
