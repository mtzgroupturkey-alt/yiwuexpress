'use client'

import { useState } from 'react'
import { LocaleLink } from '@/components/LocaleLink'
import { useRouter } from '@/i18n/navigation'
import Image from 'next/image'
import { ShoppingCart, Eye, FileText, Check } from 'lucide-react'
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
  // In pure WHOLESALE mode the B2C retail cart path is hidden so wholesale
  // customers cannot bypass MOQ via the standard cart/checkout flow.
  const showRetailCart = isRetail
  // Flash sale only counts when explicitly flagged, window is valid, and stock remains.
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
  // Choose the lowest valid price; flash sale wins over wholesale for display.
  const candidatePrice = isFlashSaleActive
    ? product.flashSalePrice!
    : hasWholesale
    ? product.wholesalePrice!
    : product.price
  const displayPrice = candidatePrice
  const priceLabel = hasWholesale && !isFlashSaleActive ? t('from') : ''
  // Check for compareAtPrice (strikethrough original price)
  const hasDiscount = product.compareAtPrice != null && product.compareAtPrice > displayPrice!

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

  // Wholesale card CTA: push the MOQ-locked variant into the B2B inquiry pool,
  // strictly isolated from the retail cart. Quantity floors at the product MOQ.
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
      className="group relative bg-white dark:bg-[#0d1e32] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-md hover:shadow-2xl hover:shadow-[#c9a84c]/20 hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Gold Accent Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-[#070d16] flex-shrink-0">
        {product.image && !imageError ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-700 ease-out ${
              isHovered ? 'scale-108' : 'scale-100'
            }`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Ambient Overlay on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-[#070d16]/80 via-black/20 to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />

        {/* Badges Stack */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {isFlashSaleActive && (
            <span className="bg-gradient-to-r from-red-600 to-amber-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-md shadow-md animate-pulse">
              {t('flashSale')}
            </span>
          )}
          {hasWholesale && (
            <span className="bg-[#1a3a5c]/95 backdrop-blur-md text-[#e5c158] text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md border border-[#c9a84c]/30">
              {t('wholesalePrice')}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md">
              {t('savePct', { pct: Math.round(((product.compareAtPrice! - displayPrice!) / product.compareAtPrice!) * 100) })}
            </span>
          )}
          {product.stock != null && product.stock > 0 && product.stock < 10 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md">
              {t('lowStock')}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <WishlistButton
          productId={product.id}
          className="absolute top-2.5 right-2.5 z-10 hover:scale-110 transition-transform shadow-md rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-white"
          size="md"
        />

        {/* Quick View Button (Slide-up on hover) */}
        <div
          className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent transition-all duration-300 z-10 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <button
            className="w-full py-2 bg-white/95 backdrop-blur-md text-gray-900 font-bold text-xs rounded-xl hover:bg-[#c9a84c] hover:text-navy-950 transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              router.push(`/products/${product.slug}`)
            }}
            aria-label={t('quickView') + ' ' + product.name}
          >
            <Eye className="w-3.5 h-3.5 text-[#1a3a5c]" />
            {t('quickView')}
          </button>
        </div>
      </div>

      {/* Product Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Category */}
          {product.category && (
            <p className="text-[11px] text-[#c9a84c] font-bold uppercase tracking-wider mb-1">
              {product.category}
            </p>
          )}

          {/* Product Name */}
          <LocaleLink
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 after:z-0 after:content-['']"
          >
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 leading-snug group-hover:text-[#c9a84c] transition-colors">
              {product.name}
            </h3>
          </LocaleLink>

          {/* Color Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 my-1.5 flex-wrap">
              {product.colors.slice(0, 4).map(color => (
                <div
                  key={color.value}
                  className="w-3.5 h-3.5 rounded-full border border-gray-200 dark:border-white/20 flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-gray-400 ml-1">+{product.colors.length - 4}</span>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div>
          {/* Pricing Row */}
          <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-baseline justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                {priceLabel && (
                  <span className="text-xs text-gray-400 font-medium">
                    {priceLabel}
                  </span>
                )}
                <span className={`text-lg font-black tracking-tight ${isFlashSaleActive ? 'text-red-600' : 'text-[#1a3a5c] dark:text-[#e5c158]'}`}>
                  ${displayPrice?.toFixed(2)}
                </span>
                {(isFlashSaleActive || hasWholesale) && product.price && (
                  <span className="text-xs text-gray-400 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
                {hasDiscount && product.compareAtPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>

              {hasWholesale && (
                <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                  {t('wholesalePrice')}: ${product.wholesalePrice?.toFixed(2)}
                </div>
              )}
            </div>

            {product.minOrder && product.minOrder > 1 && (
              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">
                MOQ: {product.minOrder}
              </span>
            )}
          </div>

          {/* Add to Cart Button (Retail) */}
          {showRetailCart && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || (product.stock !== undefined && product.stock === 0)}
              className={`relative z-10 w-full mt-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md ${
                isAddingToCart
                  ? 'bg-emerald-600 text-white'
                  : product.stock === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#1a3a5c] to-[#102a43] hover:from-[#c9a84c] hover:to-[#e5c158] hover:text-navy-950 text-white shadow-brand'
              }`}
            >
              {isAddingToCart ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('added')}
                </>
              ) : product.stock === 0 ? (
                t('outOfStock')
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {t('addToCart')}
                </>
              )}
            </button>
          )}

          {/* Wholesale Quote List Quick-Add (B2B) */}
          {isWholesale && hasWholesale && (
            <button
              onClick={handleAddToQuoteList}
              disabled={isAddingToQuote || (product.stock !== undefined && product.stock === 0)}
              className={`relative z-10 w-full mt-2 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md ${
                isAddingToQuote
                  ? 'bg-emerald-600 text-white'
                  : product.stock === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#c9a84c] to-[#e5c158] text-navy-950 hover:brightness-105'
              }`}
            >
              {isAddingToQuote ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {t('added')}
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  {t('addToQuoteList')}
                </>
              )}
            </button>
          )}

          {/* Wholesale Inquiry Link */}
          {hasWholesale && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/wholesale?product=${product.id}`)
              }}
              className="relative z-10 w-full mt-1.5 py-1 text-xs text-[#c9a84c] hover:text-[#e5c158] font-semibold transition-colors text-center"
            >
              {t('requestWholesaleQuote')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
