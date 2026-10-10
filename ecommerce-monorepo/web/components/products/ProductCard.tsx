'use client'

import { useState, useEffect } from 'react'
import { LocaleLink } from '@/components/LocaleLink'
import { useRouter } from '@/i18n/navigation'
import Image from 'next/image'
import { ProductImage } from '@/components/ui/ProductImage'
import { ShoppingCart, Eye, FileText, Check, Star } from 'lucide-react'
import { WishlistButton } from './WishlistButton'
import { useTranslations, useLocale } from 'next-intl'
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation'
import { useCurrency } from '@/hooks/useCurrency'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { useQuoteCart } from '@/components/QuoteCartContext'
import { useSettings } from '@/components/SettingsProvider'
import { useCustomerView } from '@/hooks/useCustomerView'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/components/CartContext'
import { getProductDisplayNames } from '@/lib/utils/productNames'

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
  moq?: number
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
  sku?: string
  dromkokItemNo?: string
  ikeaItemNo?: string
  brand?: string
}

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string, quantity?: number, mode?: 'RETAIL' | 'WHOLESALE') => void
}

export default function ProductCard({
  product,
  onAddToCart
}: ProductCardProps) {
  const t = useTranslations('Product')
  const locale = useLocale()
  const { tBadge } = useStorefrontTranslation()
  const { formatPrice } = useCurrency()
  const router = useRouter()
  const { settings } = useSettings()
  const { isAuthenticated } = useAuth()
  const customerView = useCustomerView()
  const { addItem: addInquiryItem } = useWholesaleInquiry()
  const { enableWholesaleSession } = useSessionMode()
  const { addToQuote } = useQuoteCart()
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToQuote, setIsAddingToQuote] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const rfqModel = settings?.rfqModel || 'RFQ'
  const isInstantWholesale = rfqModel === 'INSTANT'
  const moq = product.moq || product.minOrder || product.minOrderQty || settings?.wholesaleDefaultMoq || 1

  const {
    isGuest,
    isRetail: isRetailActive,
    isWholesale: isWholesaleActive,
    canRequestQuote,
    canAddToWholesaleCart,
  } = customerView

  const isUserLoggedIn = mounted ? (isAuthenticated || (!isGuest && (isRetailActive || isWholesaleActive))) : false
  const showRetailCart = isUserLoggedIn && !canRequestQuote && !canAddToWholesaleCart
  const hasWholesale = Boolean(product.wholesalePrice && isWholesaleActive)

  const { refreshCartCount } = useCart()

  const addWholesaleToCart = async (p: Product) => {
    setIsAddingToCart(true)
    const orderQty = Math.max(1, p.minOrderQty || moq || 1)
    const isInstant = settings?.rfqModel === 'INSTANT'

    if (isWholesaleActive && isInstant) {
      if (onAddToCart) {
        onAddToCart(p.id, orderQty, 'WHOLESALE')
      } else {
        try {
          const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              productId: p.id,
              quantity: orderQty,
              mode: 'WHOLESALE',
            }),
          })
          if (res.ok) {
            refreshCartCount()
          }
        } catch (err) {
          console.error('Error adding wholesale item to cart:', err)
        }
      }
    } else if (isWholesaleActive) {
      enableWholesaleSession()
      addInquiryItem({
        productId: p.id,
        slug: p.slug,
        name: p.name,
        image: p.image,
        wholesalePrice: (p.wholesalePrice || p.price) as number,
        retailPrice: p.price,
        quantity: orderQty,
        minOrderQty: orderQty,
      })
    } else {
      if (onAddToCart) {
        onAddToCart(p.id, 1, 'RETAIL')
      }
    }
    setTimeout(() => setIsAddingToCart(false), 1200)
  }
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

  const isWholesaleCustomer = isWholesaleActive || !isUserLoggedIn || !isRetailActive
  const isRetailUserLoggedIn = isUserLoggedIn && isRetailActive

  const effectiveWholesalePrice = product.wholesalePrice || product.price
  const candidatePrice = isFlashSaleActive
    ? product.flashSalePrice!
    : isRetailUserLoggedIn
    ? product.price
    : effectiveWholesalePrice
  const displayPrice = candidatePrice
  const priceLabel = hasWholesale && !isFlashSaleActive ? t('from') : ''

  const effectiveTaxRate = (() => {
    const rawTax =
      (product as any).taxRate ??
      (product as any).taxPercent ??
      (product as any).rawIkeaPayload?.taxRate ??
      (product as any).rawIkeaPayload?.taxPercent
    if (rawTax !== undefined && rawTax !== null && !isNaN(Number(rawTax)) && Number(rawTax) > 0) {
      return Number(rawTax)
    }
    return 20 // Standard 20% VAT fallback
  })()

  const effectiveDisplayPriceWithTax = (() => {
    if ((product as any).wholesalePriceWithTax && (product as any).wholesalePriceWithTax > 0) {
      return (product as any).wholesalePriceWithTax
    }
    if (displayPrice > 0) {
      return Math.round((displayPrice * (1 + effectiveTaxRate / 100) + Number.EPSILON) * 100) / 100
    }
    return null
  })()

  // Item # formatted as clean number only (e.g. "950.962.59")
  const rawItemNumber =
    product.dromkokItemNo ||
    (product as any).ikeaItemNo ||
    (product as any).itemNo ||
    (product as any).articleNumber ||
    product.sku ||
    ''
  const displayItemNumber = rawItemNumber
    ? rawItemNumber
        .replace(/^DK-/i, '')
        .replace(/^[a-zA-Z#:\s-]+/, '')
        .trim()
    : null

  const isStockAvailable = product.stock !== undefined ? product.stock > 0 : true
  const stockStatusLabel = isStockAvailable
    ? (locale === 'ru' ? 'В наличии' : locale === 'zh' ? '有现货' : 'In Stock')
    : (locale === 'ru' ? 'Под заказ' : locale === 'zh' ? '按需预定' : 'By Order')

  // Only show discount/crossed out if retail user is logged in
  const hasDiscount = isRetailUserLoggedIn && product.compareAtPrice != null && product.compareAtPrice > displayPrice!
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
    addToQuote({
      productId: product.id,
      productName: product.name,
      productSku: (product as any).sku || product.slug || product.id,
      productImage: product.image,
      quantity: moq,
      minOrderQty: moq,
    })
    setTimeout(() => setIsAddingToQuote(false), 1200)
  }

  return (
    <div
      className="@container group relative bg-white dark:bg-[#0d1e32] rounded-2xl overflow-hidden border border-gray-200/90 dark:border-white/10 hover:border-[#0055A4] dark:hover:border-[#0055A4] shadow-sm hover:shadow-2xl hover:shadow-blue-500/15 hover:scale-[1.015] transition-all duration-300 cursor-pointer flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Blue Accent Border Line on Hover */}
      <div className="h-1 w-full bg-[#0055A4] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Image Container with Badges */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-[#070d16] flex-shrink-0">
        <ProductImage
          src={product.image}
          alt={product.name || 'Product image'}
          category={product.category}
          productName={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-contain p-3 transition-transform duration-500 ease-out ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
        />

        {/* Stacked Badges: Stock Status > Discount (red) > New (green) > Wholesale MOQ (blue) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 items-start">
          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs tracking-wider uppercase ${
              isStockAvailable
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            {stockStatusLabel}
          </span>
          {hasDiscount && (
            <span className="bg-[#DC2626] text-white text-[11px] font-black px-2.5 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
              -{discountPct}%
            </span>
          )}
          {product.isNew && (
            <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
              {tBadge('NEW')}
            </span>
          )}
          {isFlashSaleActive && (
            <span className="bg-amber-500 text-navy-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider animate-pulse">
              {tBadge('FLASH SALE')}
            </span>
          )}
          {hasWholesale && (
            <span className="bg-[#0055A4] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
              {tBadge('moq')}: {product.minOrder || product.minOrderQty || 1}
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
          {/* Category, Item # & Rating on the right */}
          {/* Category & Item # */}
          {(product.category || displayItemNumber) && (
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {product.category && (
                <span className="text-[10px] font-semibold text-[#00407a] bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[130px]">
                  {product.category}
                </span>
              )}
              {displayItemNumber && (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono tracking-tight shrink-0">
                  {displayItemNumber}
                </span>
              )}
            </div>
          )}

          {/* Product Name: First Swedish name, next line English name */}
          {(() => {
            const { swedenName, englishName } = getProductDisplayNames(product);

            return (
              <LocaleLink
                href={`/products/${product.slug}`}
                className="after:absolute after:inset-0 after:z-0 after:content-[''] block"
              >
                <h3 className="text-xs sm:text-sm leading-snug group-hover:text-[#0055A4] transition-colors min-h-[36px]">
                  {swedenName ? (
                    <>
                      <span className="block font-black text-gray-900 dark:text-gray-100 uppercase tracking-wide truncate">
                        {swedenName}
                      </span>
                      <span className="block font-medium text-gray-600 dark:text-gray-300 text-xs line-clamp-1">
                        {englishName}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
                      {englishName || product.name}
                    </span>
                  )}
                </h3>
              </LocaleLink>
            );
          })()}
        </div>

        <div>
          {/* Price Block: Stacked on narrow cards (@container < 220px), inline with pipe on wide cards */}
          <div className="pt-2.5 border-t border-gray-100 dark:border-white/10 flex items-baseline justify-between gap-2">
            <div>
              {isRetailUserLoggedIn ? (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  {priceLabel && (
                    <span className="text-xs text-gray-400 font-medium">
                      {priceLabel}
                    </span>
                  )}
                  <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${isFlashSaleActive ? 'text-[#DC2626]' : 'text-gray-950 dark:text-white'}`}>
                    {formatPrice(displayPrice || 0)}
                  </span>
                  {hasDiscount && (product.compareAtPrice || product.price) && (
                    <span className="text-xs text-gray-400 line-through font-mono">
                      {formatPrice(product.compareAtPrice || product.price)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div className="flex flex-col @[220px]:flex-row @[220px]:items-baseline gap-0.5 @[220px]:gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                        {locale === 'ru' ? 'Без НДС:' : locale === 'zh' ? '未含税：' : 'Excl. TAX:'}
                      </span>
                      <span className="text-base sm:text-lg font-black text-gray-950 dark:text-white tracking-tight font-sans">
                        {formatPrice(displayPrice || 0)}
                      </span>
                    </div>

                    {effectiveDisplayPriceWithTax && (
                      <>
                        <span className="hidden @[220px]:inline text-gray-300 text-xs sm:text-sm font-light">|</span>

                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-tight">
                            {locale === 'ru' ? 'С НДС:' : locale === 'zh' ? '含税价：' : 'Incl. TAX:'}
                          </span>
                          <span className="text-base sm:text-lg font-black text-purple-900 dark:text-purple-300 tracking-tight font-sans">
                            {formatPrice(effectiveDisplayPriceWithTax)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stock Status Badge (Left) & Star Rating (Right) on the same line after prices */}
          <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-gray-100 dark:border-white/10">
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-wider uppercase shrink-0 ${
                isStockAvailable
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {stockStatusLabel}
            </span>

            {/* Rating on right side after prices */}
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {(product.rating || 5).toFixed(1)}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                ({product.reviewCount || 12})
              </span>
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

          {/* Wholesale B2B Button - RFQ Mode */}
          {isUserLoggedIn && canRequestQuote && hasWholesale && !isInstantWholesale && (
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
                  <span>Request Quote (MOQ {moq})</span>
                </>
              )}
            </button>
          )}

          {/* Wholesale B2B Button - INSTANT Mode */}
          {isUserLoggedIn && canAddToWholesaleCart && hasWholesale && isInstantWholesale && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                addWholesaleToCart(product)
              }}
              disabled={isAddingToCart || (product.stock !== undefined && product.stock === 0)}
              className={`relative z-10 w-full mt-2 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex flex-col items-center justify-center gap-0.5 shadow-sm cursor-pointer ${
                isAddingToCart
                  ? 'bg-emerald-600 text-white'
                  : product.stock === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:brightness-105 font-bold'
              }`}
            >
              {isAddingToCart ? (
                <div className="flex items-center gap-1.5 py-1">
                  <Check className="w-4 h-4" />
                  <span>{t('added')}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-medium opacity-90">
                    <span className="text-xs">Wholesale: ${product.wholesalePrice || product.price}</span>
                    <span>•</span>
                    <span className="text-xs">MOQ: {moq}</span>
                  </div>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
