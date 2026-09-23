'use client'

import React, { useState } from 'react'
import { Product } from '@/app/[locale]/design-3/types'
import { MobileHeader } from '../MobileHeader'
import { MobileGallery } from './MobileGallery'
import { MobileBuyBox } from './MobileBuyBox'
import { MobileTrustBadges } from './MobileTrustBadges'
import { MobileTabs } from './MobileTabs'
import { MobileVariantChips, VariantOption } from './MobileVariantChips'
import { MobileAttributeSelector, ConfigurableAttribute } from './MobileAttributeSelector'
import { StickyBuyBar } from '../StickyBuyBar'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { useMobile } from '@/components/MobileProvider'

export interface MobileProductDetailViewProps {
  product: Product
  relatedProducts?: Product[]
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
}: MobileProductDetailViewProps) {
  const { isStandalone } = useMobile()
  const { isWholesaleSession } = useSessionMode()
  const [quantity, setQuantity] = useState(product.moq || 1)
  const [legacySelectedVariant, setLegacySelectedVariant] = useState('default')
  const [internalSelectedOptions, setInternalSelectedOptions] = useState<Record<string, string>>({})
  const [isAdding, setIsAdding] = useState(false)

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

