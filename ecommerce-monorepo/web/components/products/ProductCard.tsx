'use client'

import { useState } from 'react'
import { LocaleLink } from '@/components/LocaleLink'
import Link from 'next/link'
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
  image?: string
  category?: string
  stock?: number
  minOrder?: number
  minOrderQty?: number
  wholesalePrice?: number
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
  const displayPrice = hasWholesale ? product.wholesalePrice : product.price
  const priceLabel = hasWholesale ? t('from') : ''

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
    <LocaleLink href={`/products/${product.slug}`}>
      <div
        className="group relative bg-white rounded-xl overflow-hidden border border-gray-100/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
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
              className={`object-cover transition-transform duration-500 ${
                isHovered ? 'scale-105' : 'scale-100'
              }`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <ShoppingCart className="w-12 h-12 text-gray-300" />
            </div>
          )}

          {/* Image Overlay Gradient on Hover */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasWholesale && (
              <span className="bg-secondary-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm">
                {t('wholesalePrice')}
              </span>
            )}
            {product.stock && product.stock < 10 && (
              <span className="bg-accent-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm">
                {t('lowStock')}
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <WishlistButton
            productId={product.id}
            className="absolute top-2 right-2 z-10"
            size="md"
          />

          {/* Quick View Button (appears on hover) — navigates to product detail page */}
          <div
            className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
              <button
                className="w-full py-2 bg-white/95 backdrop-blur-sm text-gray-800 font-medium text-sm rounded-lg hover:bg-white transition-all flex items-center justify-center gap-2"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = `/products/${product.slug}`
                }}
                aria-label={t('quickView') + ' ' + product.name}
              >
                <Eye className="w-4 h-4" />
                {t('quickView')}
              </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Category */}
          {product.category && (
            <p className="text-xs text-secondary-500 font-medium mb-1 uppercase tracking-wide">
              {product.category}
            </p>
          )}

          {/* Product Name */}
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {product.name}
          </h3>

          {/* Color Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              {product.colors.slice(0, 4).map(color => (
                <div
                  key={color.value}
                  className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-gray-400 ml-1">+{product.colors.length - 4}</span>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Spacer to push pricing and button to bottom */}
          <div className="flex-1"></div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mb-3">
            {priceLabel && (
              <span className="text-xs text-gray-500 font-medium">
                {priceLabel}
              </span>
            )}
            <span className="text-lg sm:text-xl font-bold text-secondary-500">
              ${displayPrice?.toFixed(2)}
            </span>
            {hasWholesale && product.price && (
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Min Order Info */}
          {product.minOrder && product.minOrder > 1 && (
              <p className="text-xs text-gray-500 mb-2">
                {t('minOrder', { n: product.minOrder })}
              </p>
          )}

          {/* Add to Cart Button - hidden in pure WHOLESALE mode */}
          {showRetailCart && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || (product.stock !== undefined && product.stock === 0)}
              className={`w-full py-2 sm:py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
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
              className={`w-full mt-2 py-2 sm:py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
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
                window.location.href = `/wholesale?product=${product.id}`
              }}
              className="w-full mt-2 py-1.5 text-xs sm:text-sm text-secondary-600 font-medium hover:text-secondary-700 transition-colors"
              >
              {t('requestWholesaleQuote')}
            </button>
          )}
        </div>
      </div>
    </LocaleLink>
  )
}
