'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Product } from '@/app/[locale]/design-3/types'
import { MobileHeader } from '../MobileHeader'
import { MobileGallery } from './MobileGallery'
import { MobileBuyBox } from './MobileBuyBox'
import { MobileTrustBadges } from './MobileTrustBadges'
import { MobileTabs } from './MobileTabs'
import { MobileVariantChips, VariantOption } from './MobileVariantChips'
import { MobileAttributeSelector, ConfigurableAttribute } from './MobileAttributeSelector'
import { MobileProductCard } from '../store/MobileProductCard'
import { StickyBuyBar } from '../StickyBuyBar'
import { ProductCardSkeleton } from '../Skeleton'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { useMobile } from '@/components/MobileProvider'

export interface MobileProductDetailViewProps {
  product: Product
  relatedProducts?: Product[]
  loadMoreRelated?: () => void
  hasMoreRelated?: boolean
  loadingMoreRelated?: boolean
  onAddToCart?: (product: Product, quantity: number) => void
  onRequestQuote?: (product: Product, quantity: number) => void
  onSelectProduct?: (product: Product) => void
  onBack?: () => void
  className?: string
  // Dynamic variant & attribute props:
  optionKeys?: string[]
  optionValuesMap?: Record<string, string[]>
  configurableAttributes?: ConfigurableAttribute[]
  selectedOptions?: Record<string, string>
  onSelectOption?: (key: string, value: string) => void
  variants?: any[]
  selectedVariant?: any
  displayPrice?: number
  compareAtPrice?: number | null
  stock?: number
  allImages?: string[]
  isWholesale?: boolean
  isInstantWholesale?: boolean
}

export function MobileProductDetailView({
  product,
  relatedProducts = [],
  onAddToCart,
  onRequestQuote,
  onSelectProduct,
  onBack,
  className = '',
  optionKeys = [],
  optionValuesMap = {},
  configurableAttributes = [],
  selectedOptions,
  onSelectOption,
  variants = [],
  selectedVariant,
  displayPrice,
  compareAtPrice,
  stock,
  allImages,
  isWholesale,
  isInstantWholesale = false,
  loadMoreRelated,
  hasMoreRelated = false,
  loadingMoreRelated = false,
}: MobileProductDetailViewProps) {
  const { isStandalone } = useMobile()
  const { isWholesaleSession } = useSessionMode()
  const [quantity, setQuantity] = useState(product.moq || 1)
  const [legacySelectedVariant, setLegacySelectedVariant] = useState('default')
  const [internalSelectedOptions, setInternalSelectedOptions] = useState<Record<string, string>>({})
  const [isAdding, setIsAdding] = useState(false)
  const relatedSentinelRef = useRef<HTMLDivElement | null>(null)

  // Automatic infinite scroll when user approaches the bottom of related products
  useEffect(() => {
    if (!hasMoreRelated || !loadMoreRelated || typeof IntersectionObserver === 'undefined') return
    const sentinel = relatedSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMoreRelated) {
          loadMoreRelated()
        }
      },
      { rootMargin: '350px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMoreRelated, loadMoreRelated, loadingMoreRelated])

  const activeSelectedOptions = selectedOptions ?? internalSelectedOptions
  const handleOptionSelect = (key: string, val: string) => {
    if (onSelectOption) {
      onSelectOption(key, val)
    } else {
      setInternalSelectedOptions((prev) => ({ ...prev, [key]: val }))
    }
  }

  const isWholesaleActive = isWholesale !== undefined ? isWholesale : isWholesaleSession

  const handleAddToCart = () => {
    setIsAdding(true)
    if (isWholesaleActive && !isInstantWholesale && onRequestQuote) {
      onRequestQuote(product, quantity)
    } else if (onAddToCart) {
      onAddToCart(product, quantity)
    }
    setTimeout(() => setIsAdding(false), 500)
  }

  const handleInquireSupplier = () => {
    if (onRequestQuote) {
      onRequestQuote(product, quantity)
    } else if (onAddToCart) {
      onAddToCart(product, quantity)
    }
  }

  const activePrice = displayPrice !== undefined ? displayPrice : (selectedVariant?.price ?? product.price)
  const activeCompareAtPrice = compareAtPrice !== undefined ? compareAtPrice : (selectedVariant?.comparePrice ?? product.oldPrice)
  const activeStock = stock !== undefined ? stock : (selectedVariant?.stock ?? (product.inStock ? 999 : 0))
  const activeImages = allImages && allImages.length > 0 ? allImages : (product.images && product.images.length > 0 ? product.images : [product.image])

  // Sample variants if product doesn't define custom finishVariants and has no dynamic options
  const fallbackVariants: VariantOption[] = product.finishVariants?.map((f, idx) => ({
    id: `v-${idx}`,
    name: f.name,
    colorHex: f.colorHex,
  })) || [
    { id: 'standard', name: 'Standard Export Model' },
    { id: 'heavy-duty', name: 'Heavy-Duty Reinforced' },
  ]

  const hasDynamicAttributes =
    (optionKeys && optionKeys.length > 0) ||
    (configurableAttributes && configurableAttributes.length > 0)

  return (
    <div
      data-testid="mobile-pdp"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] ${
        isStandalone
          ? 'pt-[calc(56px+env(safe-area-inset-top,0px))]'
          : 'pt-[calc(120px+env(safe-area-inset-top,0px))]'
      } pb-28 ${className}`}
    >
      {/* 1. Mobile Header with Back Button */}
      <MobileHeader
        showBack={true}
        onBack={onBack}
        title={product.name}
        showSearchToggle={true}
      />

      {/* 2. Swipeable Image Gallery */}
      <MobileGallery
        images={activeImages}
        mainImage={activeImages[0] || product.image}
        productName={product.name}
        discountBadge={product.discountBadge}
        inStock={activeStock > 0}
      />

      {/* 3. Product Information Container */}
      <div className="p-3.5 space-y-3">
        {/* Brand & Category */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
            {product.brand || 'Verified Manufacturer'}
          </span>
          <span>{product.category}</span>
        </div>

        {/* Product Title */}
        <h1 className="text-lg font-black text-gray-900 dark:text-white leading-snug">
          {product.name}
        </h1>

        {/* Dynamic Attributes or Legacy Variant chips */}
        {hasDynamicAttributes ? (
          <MobileAttributeSelector
            optionKeys={optionKeys}
            optionValuesMap={optionValuesMap}
            configurableAttributes={configurableAttributes}
            selectedOptions={activeSelectedOptions}
            onSelectOption={handleOptionSelect}
            variants={variants}
          />
        ) : (
          <MobileVariantChips
            title="Model Variant"
            variants={fallbackVariants}
            selectedId={legacySelectedVariant}
            onSelect={(id) => setLegacySelectedVariant(id)}
          />
        )}

        {/* Buy Box with Price & Stepper */}
        <MobileBuyBox
          product={product}
          quantity={quantity}
          price={activePrice}
          compareAtPrice={activeCompareAtPrice}
          stock={activeStock}
          isWholesale={isWholesaleActive}
          isInstantWholesale={isInstantWholesale}
          onQuantityChange={(q) => setQuantity(q)}
          onAddToCart={handleAddToCart}
          onInquireSupplier={handleInquireSupplier}
          isAdding={isAdding}
        />

        {/* Trust Badges */}
        <MobileTrustBadges />

        {/* Tabs: Overview, Specs, Shipping, Reviews */}
        <MobileTabs product={product} />

        {/* Related Products / Infinite Scroll Section */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="pt-2 pb-6 space-y-3" aria-label="Related Products">
            <div className="flex items-center justify-between px-0.5 pt-2 border-t border-gray-200/80 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                  You May Also Like
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Recommended products from verified suppliers
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {relatedProducts.map((relProduct, idx) => (
                <div
                  key={`${relProduct.id}-${idx}`}
                  style={{ animationDelay: `${Math.min(idx % 10, 6) * 45}ms` }}
                  className="animate-card-rise"
                >
                  <MobileProductCard
                    product={relProduct}
                    onAddToCart={onAddToCart ? (p) => onAddToCart(p, 1) : undefined}
                    onSelectProduct={onSelectProduct}
                  />
                </div>
              ))}
            </div>

            {/* Infinite Scroll Sentinel & Loading Indicator */}
            {hasMoreRelated && (
              <div
                ref={relatedSentinelRef}
                className="py-2 flex flex-col items-center justify-center text-xs text-gray-400 gap-3 min-h-[56px]"
              >
                {loadingMoreRelated ? (
                  <div className="w-full space-y-2">
                    <div className="grid grid-cols-2 gap-2.5 w-full">
                      <ProductCardSkeleton />
                      <ProductCardSkeleton />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-xs py-1">
                      <span className="w-3.5 h-3.5 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin" />
                      <span>Loading recommendations...</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-4 w-full flex items-center justify-center">
                    <span className="inline-block w-8 h-1 rounded-full bg-gray-200 dark:bg-slate-700/60" />
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {/* 4. Sticky Buy Bar (Always accessible for 1-tap checkout/inquiry) */}
      <StickyBuyBar
        isVisible={true}
        price={activePrice}
        compareAtPrice={activeCompareAtPrice}
        quantity={quantity}
        onQuantityChange={(q) => setQuantity(q)}
        onAddToCart={handleAddToCart}
        isWholesale={isWholesaleActive}
        isInstantWholesale={isInstantWholesale}
        minQty={product.moq || 1}
        productName={product.name}
        productImage={activeImages[0] || product.image}
      />
    </div>
  )
}

