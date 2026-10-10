'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { ProductImage } from '@/components/ui/ProductImage'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Star, Plus, Heart, Package, ClipboardList, Check } from 'lucide-react'
import { Product } from '@/app/[locale]/design-3/types'
import { useCurrency } from '@/hooks/useCurrency'
import { useCustomerView } from '@/hooks/useCustomerView'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/components/SettingsProvider'
import { getProductDisplayNames } from '@/lib/utils/productNames'

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
  const customerView = useCustomerView()
  const { settings } = useSettings()
  const { isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isUserLoggedIn = mounted ? (isAuthenticated || !customerView.isGuest) : false

  const isWholesaleActive = customerView.isWholesale
  const canRequestQuote = customerView.canRequestQuote

  const rfqModel = settings?.rfqModel || 'RFQ'
  const isInstantWholesale = rfqModel === 'INSTANT'
  const isRfqMode = canRequestQuote && !isInstantWholesale

  const moq =
    product.minOrderQty ||
    (product as any).moq ||
    (product as any).minOrder ||
    settings?.wholesaleDefaultMoq ||
    1

  const isWholesaleCustomer = isWholesaleActive || !isUserLoggedIn || !customerView.isRetail
  const isRetailUserLoggedIn = isUserLoggedIn && customerView.isRetail

  const effectiveWholesalePrice = product.wholesalePrice || product.price
  const displayPrice = isRetailUserLoggedIn ? product.price : effectiveWholesalePrice

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

  const [favPopping, setFavPopping] = useState(false)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFavPopping(true)
    setTimeout(() => setFavPopping(false), 350)
    if (onToggleFavorite) {
      onToggleFavorite(product.id)
    }
  }

  const hasDiscount = product.oldPrice && product.oldPrice > displayPrice
  const discountPercent = hasDiscount
    ? Math.round(((product.oldPrice! - displayPrice) / product.oldPrice!) * 100)
    : null

  const isStockAvailable = product.stock !== undefined ? product.stock > 0 : (product.inStock !== false)
  const stockStatusLabel = isStockAvailable
    ? (locale === 'ru' ? 'В наличии' : locale === 'zh' ? '有现货' : 'In Stock')
    : (locale === 'ru' ? 'Под заказ' : locale === 'zh' ? '按需预定' : 'By Order')

  return (
    <div
      data-testid="mobile-product-card"
      onClick={handleCardClick}
      className={`@container group rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-500/20 dark:hover:border-blue-400/20 overflow-hidden flex flex-col justify-between cursor-pointer tap-spring active:scale-[0.97] transition-all duration-200 touch-manipulation ${className}`}
    >
      {/* Thumbnail + Badges + Favorite Button */}
      <div className="relative w-full aspect-square bg-gray-50/80 dark:bg-slate-900/80 overflow-hidden">
        {/* Top Badges Stack */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
          <span
            className={`px-1.5 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-wider shadow-xs ${
              isStockAvailable
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            {stockStatusLabel}
          </span>
          {isRetailUserLoggedIn && discountPercent && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] shadow-xs tracking-tight flex items-center gap-0.5">
              <span>-{discountPercent}%</span>
            </span>
          )}
        </div>

        {mounted && (isAuthenticated || !customerView.isGuest) && onToggleFavorite && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label="Toggle wishlist"
            className="absolute top-2 right-2 z-10 min-w-[36px] min-h-[36px] rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-rose-500 active:scale-75 transition-all duration-150 shadow-xs"
          >
            <Heart
              className={`w-4 h-4 transition-all duration-200 ${
                favPopping ? 'animate-heart-pop' : ''
              } ${isFavorite ? 'fill-rose-500 text-rose-500 scale-105' : 'hover:scale-110'}`}
            />
          </button>
        )}

        <div className="absolute inset-0 p-2 transition-transform duration-300 ease-out group-hover:scale-105 flex items-center justify-center">
          <ProductImage
            src={product.image}
            alt={product.name}
            category={product.category}
            productName={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-contain p-2"
            loading="eager"
          />
        </div>
      </div>

      {/* Details */}
      <div className="p-2.5 flex flex-col justify-between flex-1 gap-2">
        <div>
          {/* Category, Item # & Brand */}
          <div className="flex items-center text-[11px] gap-1 mb-1">
            <div className="flex items-center gap-1.5 flex-wrap truncate min-w-0">
              {product.category && (
                <span className="text-[9px] font-semibold text-[#00407a] bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[110px]">
                  {product.category}
                </span>
              )}
              {displayItemNumber && (
                <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1 py-0.5 rounded font-mono tracking-tight shrink-0">
                  {displayItemNumber}
                </span>
              )}
              {product.brand && (
                <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-slate-500 truncate">
                  {product.brand}
                </span>
              )}
            </div>
          </div>
          {(() => {
            const { swedenName, englishName } = getProductDisplayNames(product);

            return (
              <h4 className="text-xs leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors min-h-[30px]">
                {swedenName ? (
                  <>
                    <span className="block font-black text-gray-900 dark:text-white uppercase tracking-wide truncate">
                      {swedenName}
                    </span>
                    <span className="block font-medium text-gray-600 dark:text-gray-300 text-[11px] line-clamp-1">
                      {englishName}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {englishName || product.name}
                  </span>
                )}
              </h4>
            );
          })()}
        </div>

        {/* Price & Action Row */}
        <div className="flex items-end justify-between gap-1 pt-1.5 border-t border-gray-100 dark:border-slate-800/80">
          <div className="flex-1 min-w-0">
            {isRetailUserLoggedIn ? (
              <>
                <div className="font-extrabold text-sm text-[#00407a] dark:text-[#F5A602]">
                  {formatPrice(displayPrice)}
                </div>
                {hasDiscount && (
                  <div className="text-[10px] text-gray-400 line-through">
                    {formatPrice(product.oldPrice!)}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-0.5">
                <div className="flex flex-col @[190px]:flex-row @[190px]:items-baseline gap-0.5 @[190px]:gap-1.5">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                      {locale === 'ru' ? 'Без НДС:' : locale === 'zh' ? '未含税：' : 'Excl. TAX:'}
                    </span>
                    <span className="font-black text-xs sm:text-sm text-gray-900 dark:text-white">
                      {formatPrice(displayPrice)}
                    </span>
                  </div>

                  {effectiveDisplayPriceWithTax && (
                    <>
                      <span className="hidden @[190px]:inline text-gray-300 text-[10px]">|</span>

                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[9px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-tight">
                          {locale === 'ru' ? 'С НДС:' : locale === 'zh' ? '含税价：' : 'Incl. TAX:'}
                        </span>
                        <span className="font-black text-xs sm:text-sm text-purple-900 dark:text-purple-300">
                          {formatPrice(effectiveDisplayPriceWithTax)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Stock Status Badge (Left) & Star Rating (Right) on the same line after prices */}
            <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-gray-100 dark:border-slate-800/80">
              <span
                className={`px-1.5 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-wider shrink-0 ${
                  isStockAvailable
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {stockStatusLabel}
              </span>

              {/* Rating stars on the right */}
              <div className="flex items-center gap-0.5 shrink-0 text-[11px] text-gray-500 dark:text-slate-400">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-gray-700 dark:text-slate-300">
                  {product.rating ? product.rating.toFixed(1) : '4.8'}
                </span>
                {product.reviewsCount ? <span className="text-[9px]">({product.reviewsCount})</span> : null}
              </div>
            </div>

            {isWholesaleCustomer && (
              <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                MOQ: {moq} {moq > 1 ? 'pcs' : 'pc'}
              </div>
            )}
          </div>

          {isUserLoggedIn && (
            <button
              type="button"
              onClick={handleActionClick}
              aria-label={isRfqMode ? 'Add to RFQ' : 'Add to Cart'}
              title={isRfqMode ? 'Add to RFQ' : 'Add to Cart'}
              className={`min-w-[40px] min-h-[40px] rounded-xl text-white flex items-center justify-center shadow-xs active:scale-85 transition-all duration-150 touch-manipulation cursor-pointer ${
                justAdded
                  ? 'bg-emerald-600 shadow-emerald-500/30 shadow-md scale-105'
                  : isRfqMode
                  ? 'bg-[#00407a] hover:bg-[#003366]'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {justAdded ? (
                <Check className="w-4 h-4 text-white animate-in zoom-in-50 duration-200" />
              ) : isRfqMode ? (
                <ClipboardList className="w-4 h-4 transition-transform group-hover:scale-110" />
              ) : (
                <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
