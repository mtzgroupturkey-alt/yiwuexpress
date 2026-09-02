'use client'

import { ModernProductCard, ModernProductData } from '@/components/ui/ModernProductCard'

interface FeaturedProductCardProps {
  product: ModernProductData
  locale?: string
  onAddToCart?: (id: string) => void
  onQuickView?: (id: string) => void
}

export function FeaturedProductCard({ product, locale = 'en', onAddToCart, onQuickView }: FeaturedProductCardProps) {
  return (
    <ModernProductCard
      product={product}
      variant="featured"
      locale={locale}
      onAddToCart={onAddToCart}
      onQuickView={onQuickView}
      className="md:col-span-2 md:row-span-2"
    />
  )
}
