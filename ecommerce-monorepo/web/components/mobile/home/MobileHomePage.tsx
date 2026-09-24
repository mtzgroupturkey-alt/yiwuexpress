'use client'

import React from 'react'
import { Product, Category } from '@/app/[locale]/design-3/types'
import { useMobile } from '@/components/MobileProvider'
import { MobileHero } from './MobileHero'
import { MobileCategoryRow } from './MobileCategoryRow'
import { MobileFlashDeals } from './MobileFlashDeals'
import { MobileBestsellersGrid } from './MobileBestsellersGrid'
import { MobileBrandStrip } from './MobileBrandStrip'
import { MobilePromoBanner } from './MobilePromoBanner'
import { MobileNewsletterCard } from './MobileNewsletterCard'
import { MobileNewArrivals } from './MobileNewArrivals'
import { MobileTrendingProducts } from './MobileTrendingProducts'
import { MobileRecommendedForYou } from './MobileRecommendedForYou'
import { MobileDealsOfTheDay } from './MobileDealsOfTheDay'
import { MobileRecentlyViewed } from './MobileRecentlyViewed'
import { MobileCategorySections } from './MobileCategorySections'

export interface MobileHomePageProps {
  products: Product[]
  categories: Category[]
  flashDeals: Product[]
  flashDealsEndDate?: string | null
  flashDealsTitle?: string
  bestSellers: Product[]
  newArrivals?: Product[]
  trendingProducts?: Product[]
  recommendedProducts?: Product[]
  dealsOfTheDay?: Product[]
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (productId: string) => void
  onNavigateView?: (view: any, params?: any) => void
  isStandaloneOverride?: boolean
  className?: string
}

export function MobileHomePage({
  products,
  categories,
  flashDeals,
  flashDealsEndDate,
  flashDealsTitle,
  bestSellers,
  newArrivals,
  trendingProducts,
  recommendedProducts,
  dealsOfTheDay,
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  onNavigateView,
  isStandaloneOverride,
  className = '',
}: MobileHomePageProps) {
  const mobile = useMobile()
  const isStandalone =
    isStandaloneOverride !== undefined ? isStandaloneOverride : mobile.isStandalone

  const handleSelectProduct = (product: Product) => {
    // Record product in recently viewed products
    if (typeof window !== 'undefined' && product?.id) {
      try {
        const KEY = 'recently_viewed_products'
        const raw = localStorage.getItem(KEY)
        const list: string[] = raw ? JSON.parse(raw) : []
        const updated = [product.id, ...list.filter((id) => id !== product.id)].slice(0, 20)
        localStorage.setItem(KEY, JSON.stringify(updated))
      } catch {
        // ignore storage errors
      }
    }
    onSelectProduct?.(product)
  }

  const handleSelectCategory = (cat: Category | string) => {
    if (typeof cat === 'string') {
      onNavigateView?.('shop', { category: cat })
    } else {
      onNavigateView?.('shop', { category: cat.slug || cat.id })
    }
  }

  // -------------------------------------------------------------------------
  // MOBILE BROWSER MODE: Keep exact existing 7 sections unchanged
  // -------------------------------------------------------------------------
  if (!isStandalone) {
    return (
      <div
        data-testid="mobile-home-page"
        data-mode="browser"
        className={`md:hidden flex flex-col space-y-4 pb-6 ${className}`}
      >
        {/* 1. Mobile Hero Carousel */}
        <MobileHero onShopNow={() => onNavigateView?.('shop')} />

        {/* 2. Mobile Category Row */}
        <MobileCategoryRow
          categories={categories && categories.length > 0 ? categories : undefined}
          onSelectCategory={handleSelectCategory}
        />

        {/* 3. Mobile Flash Deals */}
        <MobileFlashDeals
          deals={flashDeals || []}
          endDate={flashDealsEndDate}
          title={flashDealsTitle}
          onAddToCart={onAddToCart}
          onSelectProduct={handleSelectProduct}
          onViewAll={() => onNavigateView?.('shop', { filter: 'deals' })}
        />

        {/* 4. Promotional Banner Card */}
        <MobilePromoBanner onAction={() => onNavigateView?.('wholesale')} />

        {/* 5. Mobile Best Sellers Grid */}
        <MobileBestsellersGrid
          products={bestSellers}
          onAddToCart={onAddToCart}
          onSelectProduct={handleSelectProduct}
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

  // -------------------------------------------------------------------------
  // PWA STANDALONE MODE: Full rich native app experience with 13 rich sections
  // -------------------------------------------------------------------------
  return (
    <div
      data-testid="mobile-home-page"
      data-mode="standalone"
      className={`md:hidden flex flex-col space-y-4 pb-8 ${className}`}
    >
      {/* 1. Mobile Hero Carousel (swipeable banner carousel) */}
      <MobileHero onShopNow={() => onNavigateView?.('shop')} />

      {/* 2. Mobile Category Row (horizontal scroll icons) */}
      <MobileCategoryRow
        categories={categories && categories.length > 0 ? categories : undefined}
        onSelectCategory={handleSelectCategory}
      />

      {/* 3. Mobile Flash Deals (countdown timer + horizontal deals carousel) */}
      <MobileFlashDeals
        deals={flashDeals || []}
        endDate={flashDealsEndDate}
        title={flashDealsTitle}
        onAddToCart={onAddToCart}
        onSelectProduct={handleSelectProduct}
        onViewAll={() => onNavigateView?.('shop', { filter: 'deals' })}
      />

      {/* 4. Mobile New Arrivals (fresh products from verified manufacturers) */}
      <MobileNewArrivals
        products={newArrivals}
        onAddToCart={onAddToCart}
        onSelectProduct={handleSelectProduct}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onViewAll={() => onNavigateView?.('shop', { sort: 'newest' })}
      />

      {/* 5. Mobile Trending Products (most viewed & requested products) */}
      <MobileTrendingProducts
        products={trendingProducts}
        onAddToCart={onAddToCart}
        onSelectProduct={handleSelectProduct}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onViewAll={() => onNavigateView?.('shop', { sort: 'popularity' })}
      />

      {/* 6. Mobile Best Sellers Grid (2-column dense catalog showcase) */}
      <MobileBestsellersGrid
        products={bestSellers}
        limit={10}
        onAddToCart={onAddToCart}
        onSelectProduct={handleSelectProduct}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onViewAll={() => onNavigateView?.('shop')}
      />

      {/* 7. Mobile Recommended For You (personalized / top-rated picks) */}
      <MobileRecommendedForYou
        products={recommendedProducts}
        onAddToCart={onAddToCart}
        onSelectProduct={handleSelectProduct}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onViewAll={() => onNavigateView?.('shop')}
      />

      {/* 8. Mobile Deals of the Day (daily clearance & discount specials) */}
      <MobileDealsOfTheDay
        products={dealsOfTheDay}
        onAddToCart={onAddToCart}
        onSelectProduct={handleSelectProduct}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onViewAll={() => onNavigateView?.('shop', { filter: 'deals' })}
      />

      {/* 9. Mobile Recently Viewed (items from local browsing history) */}
      <MobileRecentlyViewed
        onAddToCart={onAddToCart}
        onSelectProduct={handleSelectProduct}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
      />

      {/* 10. Mobile Category Sections (top department rows with >= 6 products each) */}
      <MobileCategorySections
        categories={categories}
        allProducts={products}
        onAddToCart={onAddToCart}
        onSelectProduct={handleSelectProduct}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onNavigateView={onNavigateView}
      />

      {/* 11. Promotional Banner Card */}
      <MobilePromoBanner onAction={() => onNavigateView?.('wholesale')} />

      {/* 12. Verified Factory & Brand Strip */}
      <MobileBrandStrip />

      {/* 13. Newsletter Subscription Card */}
      <MobileNewsletterCard />
    </div>
  )
}
