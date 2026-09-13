'use client'

import { useState } from 'react'
import { LocaleLink } from '@/components/LocaleLink'
import { useRouter } from '@/i18n/navigation'
import Image from 'next/image'
import { ShoppingCart, Eye, FileText, Check, Star } from 'lucide-react'
import { WishlistButton } from './WishlistButton'
import { useTranslations } from 'next-intl'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useSessionMode } from '@/contexts/SessionModeContext'

interface Product {
  id: string
  slug: string
  name: string
  description?: string
  price: number
  compareAtPrice?: number
  image?: string
  category?: string
  stock?: number
  minOrder?: number
  minOrderQty?: number
  wholesalePrice?: number
  isFlashSale?: boolean
  flashSalePrice?: number | null
  flashSaleStock?: number | null
  flashSaleStart?: string | null
  flashSaleEnd?: string | null
  colors?: { label: string; value: string }[]
  rating?: number
  reviewCount?: number
  isNew?: boolean
  isFeatured?: boolean
}

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
}

export default function ProductCard({
  product,
  onAddToCart
}: ProductCardProps) {
  const t = useTranslations('Product')
  const router = useRouter()
  const { isWholesale, isRetail } = useStoreMode()
  const { addItem: addInquiryItem } = useWholesaleInquiry()
  const { enableWholesaleSession } = useSessionMode()
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToQuote, setIsAddingToQuote] = useState(false)

  const hasWholesale = product.wholesalePrice && product.wholesalePrice < product.price
  const showRetailCart = isRetail
  const now = Date.now()
  const flashStart = product.flashSaleStart ? new Date(product.flashSaleStart).getTime() : 0
  const flashEnd = product.flashSaleEnd ? new Date(product.flashSaleEnd).getTime() : 0
  const isFlashSaleActive =
    !!product.isFlashSale &&
    !!product.flashSalePrice &&
    product.flashSalePrice > 0 &&
    product.flashSalePrice < product.price &&
    (flashStart === 0 || now >= flashStart) &&
    (flashEnd === 0 || now < flashEnd) &&
    (product.flashSaleStock == null || product.flashSaleStock > 0)

  const candidatePrice = isFlashSaleActive
    ? product.flashSalePrice!
    : hasWholesale
    ? product.wholesalePrice!
    : product.price
  const displayPrice = candidatePrice
  const priceLabel = hasWholesale && !isFlashSaleActive ? t('from') : ''
  const hasDiscount = product.compareAtPrice != null && product.compareAtPrice > displayPrice!
  const discountPct = hasDiscount ? Math.round(((product.compareAtPrice! - displayPrice!) / product.compareAtPrice!) * 100) : 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!onAddToCart) return

    setIsAddingToCart(true)
    try {
      await onAddToCart(product.id)
    } finally {
      setTimeout(() => setIsAddingToCart(false), 1000)
    }
  }

  const handleAddToQuoteList = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!hasWholesale) return

    setIsAddingToQuote(true)
    const moq = product.minOrder || product.minOrderQty || 1
    enableWholesaleSession()
    addInquiryItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      wholesalePrice: product.wholesalePrice as number,
      retailPrice: product.price,
      quantity: moq,
      minOrderQty: moq,
    })
    setTimeout(() => setIsAddingToQuote(false), 1200)
  }

  return (
    <div
      className="group relative bg-white dark:bg-[#0d1e32] rounded-2xl overflow-hidden border border-gray-200/90 dark:border-white/10 hover:border-[#0055A4] dark:hover:border-[#0055A4] shadow-sm hover:shadow-2xl hover:shadow-blue-500/15 hover:scale-[1.015] transition-all duration-300 cursor-pointer flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Blue Accent Border Line on Hover */}
      <div className="h-1 w-full bg-[#0055A4] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Image Container with Badges */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-[#070d16] flex-shrink-0">
        {product.image && !imageError ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-contain p-3 transition-transform duration-500 ease-out ${
              isHovered ? 'scale-105' : 'scale-100'
            }`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <ShoppingCart className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Stacked Badges: Discount (red) > New (green) > Wholesale MOQ (blue) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 items-start">
          {hasDiscount && (
            <span className="bg-[#DC2626] text-white text-[11px] font-black px-2.5 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
              -{discountPct}%
            </span>
          )}
          {product.isNew && (
            <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
              {t('newBadge') || 'NEW'}
            </span>
          )}
          {isFlashSaleActive && (
            <span className="bg-amber-500 text-navy-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider animate-pulse">
              {t('flashSale')}
            </span>
          )}
          {hasWholesale && (
            <span className="bg-[#0055A4] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
              MOQ: {product.minOrder || product.minOrderQty || 1}
            </span>
          )}
        </div>

        {/* Wishlist Button: Always visible with heart hover scale */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <WishlistButton
            productId={product.id}
            className="p-1.5 rounded-full bg-white/95 dark:bg-black/70 text-gray-600 hover:text-red-600 shadow-sm hover:scale-115 transition-all duration-200"
            size="md"
          />
        </div>

        {/* Quick View Button on Hover */}
        <div
          className={`absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-all duration-300 z-10 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <button
            className="w-full py-2 bg-white text-gray-900 font-extrabold text-xs rounded-xl hover:bg-[#0055A4] hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              router.push(`/products/${product.slug}`)
            }}
            aria-label={t('quickView') + ' ' + product.name}
          >
            <Eye className="w-3.5 h-3.5" />
            {t('quickView')}
          </button>
        </div>
      </div>

      {/* Product Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Rating & Reviews */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating || 5)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200 dark:text-gray-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-gray-400 font-mono">
              ({product.reviewCount || 12})
            </span>
          </div>

          {/* Product Name */}
          <LocaleLink
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 after:z-0 after:content-['']"
          >
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-[#0055A4] transition-colors">
              {product.name}
            </h3>
          </LocaleLink>
        </div>

        <div>
          {/* Availability Status Tag (emall.by style) */}
          <div className="flex items-center gap-1.5 mb-2.5">
            {product.stock !== undefined && product.stock > 0 ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('inStock' as any) || 'В наличии / In Stock'}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                {t('outOfStock')}
              </span>
            )}
          </div>

          {/* Price Block: Bold typography + Strikethrough comparison */}
          <div className="pt-2.5 border-t border-gray-100 dark:border-white/10 flex items-baseline justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                {priceLabel && (
                  <span className="text-xs text-gray-400 font-medium">
                    {priceLabel}
                  </span>
                )}
                <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${isFlashSaleActive ? 'text-[#DC2626]' : 'text-gray-950 dark:text-white'}`}>
                  ${displayPrice?.toFixed(2)}
                </span>
                {(isFlashSaleActive || hasWholesale || hasDiscount) && (product.compareAtPrice || product.price) && (
                  <span className="text-xs text-gray-400 line-through font-mono">
                    ${(product.compareAtPrice || product.price).toFixed(2)}
                  </span>
                )}
              </div>

              {hasWholesale && (
                <div className="text-[10px] text-[#0055A4] font-bold mt-0.5 font-mono">
                  {t('wholesalePrice')}: ${product.wholesalePrice?.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Add to Cart Button (Retail): Always visible, hover micro-lift & slide up */}
          {showRetailCart && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || (product.stock !== undefined && product.stock === 0)}
              className={`relative z-10 w-full mt-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm group-hover:shadow-lg group-hover:-translate-y-0.5 active:translate-y-0 ${
                isAddingToCart
                  ? 'bg-emerald-600 text-white'
                  : product.stock === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#0055A4] hover:bg-[#004080] text-white'
              }`}
            >
              {isAddingToCart ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('added')}</span>
                </>
              ) : product.stock === 0 ? (
                t('outOfStock')
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{t('addToCart')}</span>
                </>
              )}
            </button>
          )}

          {/* Wholesale Quote List Button (B2B) */}
          {isWholesale && hasWholesale && (
            <button
              onClick={handleAddToQuoteList}
              disabled={isAddingToQuote || (product.stock !== undefined && product.stock === 0)}
              className={`relative z-10 w-full mt-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                isAddingToQuote
                  ? 'bg-emerald-600 text-white'
                  : product.stock === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-navy-950 hover:brightness-105 font-bold'
              }`}
            >
              {isAddingToQuote ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('added')}</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('addToQuoteList')}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
