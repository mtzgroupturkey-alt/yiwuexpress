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
        className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100/90 shadow-sm hover:shadow-2xl hover:shadow-gray-200/80 hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
          {product.image && !imageError ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-transform duration-700 ease-out ${
                isHovered ? 'scale-110' : 'scale-100'
              }`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <ShoppingCart className="w-12 h-12 text-gray-300" />
            </div>
          )}

          {/* Image Overlay Gradient on Hover */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {isFlashSaleActive && (
              <span className="bg-red-600/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md animate-pulse">
                {t('flashSale')}
              </span>
            )}
            {hasWholesale && (
              <span className="bg-[#1a3a5c]/95 backdrop-blur-md text-[#deb859] text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md border border-[#c9a84c]/30">
                {t('wholesalePrice')}
              </span>
            )}
            {hasDiscount && (
              <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                {t('savePct', { pct: Math.round(((product.compareAtPrice! - displayPrice!) / product.compareAtPrice!) * 100) })}
              </span>
            )}
            {product.stock != null && product.stock > 0 && product.stock < 10 && (
              <span className="bg-orange-500/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                {t('lowStock')}
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <WishlistButton
            productId={product.id}
            className="absolute top-2.5 right-2.5 z-10 hover:scale-110 transition-transform shadow-md rounded-full"
            size="md"
          />

          {/* Quick View Button (slide-up on hover) */}
          <div
            className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent transition-all duration-300 z-10 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
              <button
                className="w-full py-2 bg-white/95 backdrop-blur-md text-gray-900 font-bold text-xs rounded-xl hover:bg-white transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 hover:text-[#1a3a5c]"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push(`/products/${product.slug}`)
                }}
                aria-label={t('quickView') + ' ' + product.name}
              >
                <Eye className="w-3.5 h-3.5 text-[#c9a84c]" />
                {t('quickView')}
              </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Category */}
          {product.category && (
            <p className="text-[11px] text-secondary-500 font-bold mb-1 uppercase tracking-wider">
              {product.category}
            </p>
          )}

          {/* Product Name */}
          <LocaleLink
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 after:z-0 after:content-['']"
          >
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 line-clamp-2 leading-tight group-hover:text-[#1a3a5c] transition-colors">
              {product.name}
            </h3>
          </LocaleLink>

          {/* Color Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              {product.colors.slice(0, 4).map(color => (
                <div
                  key={color.value}
                  className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0 shadow-xs"
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
            <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Spacer to push pricing and button to bottom */}
          <div className="flex-1"></div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            {priceLabel && (
              <span className="text-xs text-gray-400 font-medium">
                {priceLabel}
              </span>
            )}
            <span className={`text-lg sm:text-xl font-extrabold tracking-tight ${isFlashSaleActive ? 'text-red-600' : 'text-[#1a3a5c]'}`}>
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

          {/* Min Order Info Badge */}
          {product.minOrder && product.minOrder > 1 && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-semibold">
                <span>MOQ:</span>
                <span className="text-gray-900 font-bold">{product.minOrder}</span>
                <span>units</span>
              </span>
            </div>
          )}

          {/* Add to Cart Button - hidden in pure WHOLESALE mode */}
          {showRetailCart && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || (product.stock !== undefined && product.stock === 0)}
              className={`relative z-10 w-full py-2 sm:py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                isAddingToCart
                  ? 'bg-success text-white'
                  : product.stock === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
              }`}
            >
              {isAddingToCart ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('added')}
                </>
              ) : product.stock === 0 ? (
                t('outOfStock')
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  {t('addToCart')}
                </>
              )}
            </button>
          )}

          {/* Wholesale Quote List quick-add (B2B path) */}
          {isWholesale && hasWholesale && (
            <button
              onClick={handleAddToQuoteList}
              disabled={isAddingToQuote || (product.stock !== undefined && product.stock === 0)}
              className={`relative z-10 w-full mt-2 py-2 sm:py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                isAddingToQuote
                  ? 'bg-blue-600 text-white'
                  : product.stock === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isAddingToQuote ? (
                <>
                  <Check className="w-4 h-4" />
                  {t('added')}
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
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
              className="relative z-10 w-full mt-2 py-1.5 text-xs sm:text-sm text-secondary-600 font-medium hover:text-secondary-700 transition-colors"
              >
              {t('requestWholesaleQuote')}
            </button>
          )}
        </div>
      </div>
  )
}
