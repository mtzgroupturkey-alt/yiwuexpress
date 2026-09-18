'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ProductImage } from '@/components/ui/ProductImage'
import { Star, ShoppingCart, Check, Heart, Eye } from 'lucide-react'
import { ProductItem } from '@/data/products'
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation'
import { useCurrency } from '@/hooks/useCurrency'

interface ElectronicsProductCardProps {
  product: ProductItem
  onQuickView?: (product: ProductItem) => void
  onAddToCart?: (product: ProductItem) => void
}

export function ElectronicsProductCard({
  product,
  onQuickView,
  onAddToCart
}: ElectronicsProductCardProps) {
  const { tShop, tBadge, tFlash, tPdp } = useStorefrontTranslation()
  const { formatPrice } = useCurrency()
  const [isAdded, setIsAdded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageError, setImageError] = useState(false)

  const discount = product.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : null

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAdded(true)
    onAddToCart?.(product)
    setTimeout(() => setIsAdded(false), 1200)
  }

  return (
    <div className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 hover:border-[#FF4D00]/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(255,77,0,0.12)] transition-all duration-300 hover:-translate-y-1 p-3.5 sm:p-4 h-full">
      {/* Top badges & Wishlist */}
      <div>
        <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 mb-3 flex items-center justify-center">
          {/* Status Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
            {discount && (
              <span className="bg-[#FF4D00] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                -{discount}%
              </span>
            )}
            {product.badge === 'HIT' && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                {tBadge('BESTSELLER')}
              </span>
            )}
            {product.badge === 'NEW' && (
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                {tBadge('NEW')}
              </span>
            )}
          </div>

          {/* Favorite button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsFavorite(!isFavorite)
            }}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-110 transition-all cursor-pointer"
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </button>

          {/* Product Image */}
          <ProductImage
            src={product.image}
            alt={product.name || 'Product image'}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Quick view on hover */}
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onQuickView(product)
              }}
              className="absolute inset-x-3 bottom-3 py-2 bg-white/95 backdrop-blur-xs text-slate-900 hover:bg-[#FF4D00] hover:text-white font-bold text-xs rounded-xl shadow-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{tShop('viewMode') || 'Quick View'}</span>
            </button>
          )}
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-400 font-mono">
            {product.rating.toFixed(1)} ({product.reviews})
          </span>
        </div>

        {/* Product Name */}
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#FF4D00] transition-colors line-clamp-2 leading-snug mb-2">
          {product.name}
        </h3>

        {/* Key Specs tags if present */}
        {product.specs && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {Object.entries(product.specs).slice(0, 2).map(([key, val]) => (
              <span key={key} className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {val}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pricing & Add to Cart Footer */}
      <div className="pt-2.5 border-t border-slate-100">
        <div className="flex items-baseline gap-2 mb-2.5">
          <span className="text-lg sm:text-xl font-black font-mono text-slate-950 tracking-tight">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-xs text-slate-400 line-through font-mono">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart button */}
        <button
          type="button"
          onClick={handleAdd}
          className={`w-full py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 ${
            isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-[#FF4D00] hover:bg-[#e04400] text-white hover:shadow-md'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" />
              <span>{tPdp('added')}</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>{tFlash('addToCart')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

