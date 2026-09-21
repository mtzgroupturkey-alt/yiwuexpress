'use client'

import React, { useState } from 'react'
import { Product } from '@/app/[locale]/design-3/types'
import { MobileHeader } from '../MobileHeader'
import { MobileGallery } from './MobileGallery'
import { MobileBuyBox } from './MobileBuyBox'
import { MobileTrustBadges } from './MobileTrustBadges'
import { MobileTabs } from './MobileTabs'
import { MobileVariantChips, VariantOption } from './MobileVariantChips'
import { StickyBuyBar } from '../StickyBuyBar'
import { useSessionMode } from '@/contexts/SessionModeContext'

interface MobileProductDetailViewProps {
  product: Product
  relatedProducts?: Product[]
  onAddToCart?: (product: Product, quantity: number) => void
  onSelectProduct?: (product: Product) => void
  onBack?: () => void
  className?: string
}

export function MobileProductDetailView({
  product,
  relatedProducts = [],
  onAddToCart,
  onSelectProduct,
  onBack,
  className = '',
}: MobileProductDetailViewProps) {
  const { isWholesaleSession } = useSessionMode()
  const [quantity, setQuantity] = useState(product.moq || 1)
  const [selectedVariant, setSelectedVariant] = useState('default')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = () => {
    setIsAdding(true)
    if (onAddToCart) {
      onAddToCart(product, quantity)
    }
    setTimeout(() => setIsAdding(false), 500)
  }

  // Sample variants if product doesn't define custom finishVariants
  const variants: VariantOption[] = product.finishVariants?.map((f, idx) => ({
    id: `v-${idx}`,
    name: f.name,
    colorHex: f.colorHex,
  })) || [
    { id: 'standard', name: 'Standard Export Model' },
    { id: 'heavy-duty', name: 'Heavy-Duty Reinforced' },
  ]

  return (
    <div
      data-testid="mobile-pdp"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] pb-28 ${className}`}
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
        images={product.images && product.images.length > 0 ? product.images : [product.image]}
        mainImage={product.image}
        productName={product.name}
        discountBadge={product.discountBadge}
        inStock={product.inStock}
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

        {/* Variant selection */}
        <MobileVariantChips
          title="Model Variant"
          variants={variants}
          selectedId={selectedVariant}
          onSelect={(id) => setSelectedVariant(id)}
        />

        {/* Buy Box with Price & Stepper */}
        <MobileBuyBox
          product={product}
          quantity={quantity}
          onQuantityChange={(q) => setQuantity(q)}
          onAddToCart={handleAddToCart}
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
        price={product.price}
        compareAtPrice={product.oldPrice}
        quantity={quantity}
        onQuantityChange={(q) => setQuantity(q)}
        onAddToCart={handleAddToCart}
        isWholesale={isWholesaleSession}
        minQty={product.moq || 1}
        productName={product.name}
        productImage={product.image}
      />
    </div>
  )
}
