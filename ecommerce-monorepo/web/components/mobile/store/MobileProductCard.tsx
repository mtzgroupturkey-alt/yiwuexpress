'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ProductImage } from '@/components/ui/ProductImage'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Star, Plus, Heart, Package, ClipboardList, Check } from 'lucide-react'
import { Product } from '@/app/[locale]/design-3/types'
import { useCurrency } from '@/hooks/useCurrency'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useSettings } from '@/components/SettingsProvider'

interface MobileProductCardProps {
  product: Product
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  isFavorite?: boolean
  onToggleFavorite?: (productId: string) => void
  className?: string
}

export function MobileProductCard({
  product,
  onAddToCart,
  onSelectProduct,
  isFavorite = false,
  onToggleFavorite,
  className = '',
}: MobileProductCardProps) {
  const router = useRouter()
  const locale = useLocale()
  const { formatPrice } = useCurrency()
  const { isWholesaleSession } = useSessionMode()
  const { storeMode } = useStoreMode()
  const { settings } = useSettings()

  const [justAdded, setJustAdded] = useState(false)

  const isWholesaleActive =
    isWholesaleSession !== undefined
      ? isWholesaleSession
      : storeMode === 'WHOLESALE'

  const rfqModel = settings?.rfqModel || 'RFQ'
  const isInstantWholesale = rfqModel === 'INSTANT'
  const isRfqMode = isWholesaleActive && !isInstantWholesale

  const moq =
    product.minOrderQty ||
    (product as any).moq ||
    (product as any).minOrder ||
    settings?.wholesaleDefaultMoq ||
    1
  const effectiveWholesalePrice = product.wholesalePrice || product.price
  const displayPrice = isWholesaleActive ? effectiveWholesalePrice : product.price

  const handleCardClick = () => {
    if (onSelectProduct) {
      onSelectProduct(product)
    } else {
      router.push(`/${locale}/products/${product.slug || product.id}`)
    }
  }

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
    if (onAddToCart) {
      onAddToCart(product, 1)
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite(product.id)
    }
  }

  const hasDiscount = product.oldPrice && product.oldPrice > displayPrice
  const discountPercent = hasDiscount
    ? Math.round(((product.oldPrice! - displayPrice) / product.oldPrice!) * 100)
    : null

  return (
    <div
      data-testid="mobile-product-card"
      onClick={handleCardClick}
      className={`rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between cursor-pointer active:scale-98 transition-transform touch-manipulation ${className}`}
    >
      {/* Thumbnail + Badges + Favorite Button */}
      <div className="relative w-full aspect-square bg-gray-50 dark:bg-slate-900 p-2">
        {discountPercent && (
          <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] shadow-xs">
            -{discountPercent}%
          </span>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label="Toggle wishlist"
            className="absolute top-2 right-2 z-10 min-w-[36px] min-h-[36px] rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs flex items-center justify-center text-gray-400 hover:text-rose-500 active:scale-90 transition-transform shadow-xs"
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? 'fill-rose-500 text-rose-500' : ''
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
          sizes="(max-width: 768px) 50vw, 200px"
          className="object-contain p-2"
          loading="lazy"
        />
      </div>

      {/* Details */}
      <div className="p-2.5 flex flex-col justify-between flex-1 gap-2">
        <div>
          {product.brand && (
            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 truncate">
              {product.brand}
            </p>
          )}
          <h4 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
            {product.name}
          </h4>

          {/* Rating stars */}
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-gray-700 dark:text-slate-300">
              {product.rating ? product.rating.toFixed(1) : '4.8'}
            </span>
            {product.reviewsCount ? <span>({product.reviewsCount})</span> : null}
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="flex items-end justify-between gap-1 pt-1.5 border-t border-gray-100 dark:border-slate-800/80">
          <div>
            <div className="font-extrabold text-sm text-[#00407a] dark:text-[#F5A602]">
              {formatPrice(displayPrice)}
            </div>
            {hasDiscount && (
              <div className="text-[10px] text-gray-400 line-through">
                {formatPrice(product.oldPrice!)}
              </div>
            )}
            {isWholesaleActive && product.wholesalePrice && product.wholesalePrice < product.price && !hasDiscount && (
              <div className="text-[10px] text-gray-400 line-through">
                {formatPrice(product.price)}
              </div>
            )}
            {isWholesaleActive && (
              <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                MOQ: {moq} {moq > 1 ? 'pcs' : 'pc'}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleActionClick}
            aria-label={isRfqMode ? 'Add to RFQ' : 'Add to Cart'}
            title={isRfqMode ? 'Add to RFQ' : 'Add to Cart'}
            className={`min-w-[40px] min-h-[40px] rounded-xl text-white flex items-center justify-center shadow-xs active:scale-90 transition-all touch-manipulation cursor-pointer ${
              justAdded
                ? 'bg-emerald-600'
                : isRfqMode
                ? 'bg-[#00407a] hover:bg-[#003366]'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {justAdded ? (
              <Check className="w-4 h-4 text-white animate-in zoom-in-50 duration-200" />
            ) : isRfqMode ? (
              <ClipboardList className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
