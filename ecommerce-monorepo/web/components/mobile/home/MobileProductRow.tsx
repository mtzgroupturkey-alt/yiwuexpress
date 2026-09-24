'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Star, Plus, Check, ShoppingCart, Heart, Package } from 'lucide-react'
import { Product } from '@/app/[locale]/design-3/types'
import { ProductImage } from '@/components/ui/ProductImage'
import { useCurrency } from '@/hooks/useCurrency'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { Skeleton } from '../Skeleton'

export interface MobileProductRowProps {
  products?: Product[]
  isLoading?: boolean
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (productId: string) => void
  className?: string
}

export function MobileProductRow({
  products,
  isLoading = false,
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  className = '',
}: MobileProductRowProps) {
  const router = useRouter()
  const locale = useLocale()
  const { formatPrice } = useCurrency()
  const { isWholesaleSession } = useSessionMode()
  const [justAddedId, setJustAddedId] = React.useState<string | null>(null)

  const handleCardClick = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product)
    } else {
      router.push(`/${locale}/products/${product.slug || product.id}`)
    }
  }

  const handleActionClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    setJustAddedId(product.id)
    setTimeout(() => setJustAddedId(null), 1500)
    if (onAddToCart) {
      onAddToCart(product, 1)
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite(productId)
    }
  }

  if (isLoading) {
    return (
      <div
        data-testid="mobile-product-row-loading"
        className={`flex items-stretch gap-3 overflow-x-auto no-scrollbar px-4 py-1.5 ${className}`}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[156px] rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 p-2.5 space-y-2.5"
          >
            <Skeleton className="w-full aspect-square rounded-xl" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <div
      data-testid="mobile-product-row"
      className={`flex items-stretch gap-3 overflow-x-auto no-scrollbar px-4 py-1.5 scroll-smooth snap-x snap-mandatory ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {products.map((product) => {
        const isFav = favoriteIds ? favoriteIds.has(product.id) : false
        const isAdded = justAddedId === product.id

        const displayPrice = isWholesaleSession
          ? product.wholesalePrice || product.price
          : product.price
        const moq =
          product.minOrderQty ||
          (product as any).moq ||
          (product as any).minOrder ||
          1

        return (
          <div
            key={product.id}
            data-testid={`mobile-product-card-${product.id}`}
            onClick={() => handleCardClick(product)}
            className="snap-start shrink-0 w-[156px] rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer active:scale-[0.98] transition-all touch-manipulation relative"
          >
            {/* Image Box */}
            <div className="relative w-full aspect-square bg-gray-50 dark:bg-slate-900 p-2 flex items-center justify-center overflow-hidden">
              {product.discountBadge && (
                <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] shadow-xs">
                  {product.discountBadge}
                </span>
              )}

              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => handleFavoriteClick(e, product.id)}
                  aria-label="Add to wishlist"
                  className="absolute top-2 right-2 z-10 min-w-[36px] min-h-[36px] rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs flex items-center justify-center text-gray-400 hover:text-rose-500 active:scale-90 transition-transform shadow-xs touch-manipulation"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFav ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                </button>
              )}

              <ProductImage
                src={product.image}
                alt={product.name}
                category={product.category}
                productName={product.name}
                fill
                sizes="156px"
                className="object-contain p-2"
                loading="lazy"
              />
            </div>

            {/* Info Box */}
            <div className="p-2.5 flex flex-col justify-between flex-1 gap-1.5">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 truncate">
                  {product.brand || product.category || 'Global Trade'}
                </p>
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight min-h-[2rem]">
                  {product.name}
                </h4>
              </div>

              {/* Wholesale MOQ / Rating */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400">
                {isWholesaleSession ? (
                  <span className="inline-flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded text-[10px]">
                    <Package className="w-3 h-3" />
                    MOQ: {moq}
                  </span>
                ) : (
                  <div className="flex items-center gap-0.5 text-amber-500 font-semibold text-[11px]">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{product.rating || '4.9'}</span>
                  </div>
                )}
              </div>

              {/* Price & Add to Cart button */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-slate-800">
                <div className="min-w-0">
                  <div className="text-xs font-black text-gray-900 dark:text-white truncate">
                    {formatPrice(displayPrice)}
                  </div>
                  {product.oldPrice && product.oldPrice > displayPrice && (
                    <div className="text-[10px] text-gray-400 line-through">
                      {formatPrice(product.oldPrice)}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleActionClick(e, product)}
                  aria-label={isAdded ? 'Added' : 'Add to cart'}
                  className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all active:scale-90 touch-manipulation cursor-pointer shrink-0 ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-primary-600 hover:bg-primary-700 text-white shadow-xs'
                  }`}
                >
                  {isAdded ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
