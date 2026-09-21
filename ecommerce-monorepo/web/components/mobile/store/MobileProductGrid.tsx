'use client'

import React from 'react'
import { Product } from '@/app/[locale]/design-3/types'
import { MobileProductCard } from './MobileProductCard'
import { Skeleton } from '../Skeleton'
import { EmptyState } from '../EmptyState'

interface MobileProductGridProps {
  products: Product[]
  isLoading?: boolean
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (productId: string) => void
  emptyTitle?: string
  emptyDescription?: string
  onResetFilters?: () => void
  className?: string
}

export function MobileProductGrid({
  products,
  isLoading = false,
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your filters, category, or search keywords.',
  onResetFilters,
  className = '',
}: MobileProductGridProps) {
  if (isLoading) {
    return (
      <div
        data-testid="mobile-product-grid-loading"
        className={`grid grid-cols-2 gap-2.5 px-3 py-2 ${className}`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-slate-800 p-2.5 space-y-2.5"
          >
            <Skeleton className="w-full aspect-square rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={onResetFilters ? 'Reset Filters' : undefined}
        onAction={onResetFilters}
      />
    )
  }

  return (
    <div
      data-testid="mobile-product-grid"
      className={`grid grid-cols-2 gap-2.5 px-3 py-2 ${className}`}
    >
      {products.map((product) => (
        <MobileProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onSelectProduct={onSelectProduct}
          isFavorite={favoriteIds ? favoriteIds.has(product.id) : false}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}
