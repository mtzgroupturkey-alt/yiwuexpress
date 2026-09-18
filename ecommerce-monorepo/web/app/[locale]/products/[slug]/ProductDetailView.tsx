'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { ProductImageGallery } from '@/components/products/ProductImageGallery'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart, Minus, Plus, Package, Truck, ArrowLeft, FileText, ChevronDown, ChevronUp, ChevronRight, Share2, Star, Check, MessageCircle, Ruler, RefreshCw, HelpCircle } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import { ReviewSection } from '@/components/products/ReviewSection'
import { TrustBadgesMini } from '@/components/TrustBadgesMini'
import { WishlistButton } from '@/components/products/WishlistButton'
import { useCart } from '@/components/CartContext'
import { useQuoteCart } from '@/components/QuoteCartContext'
import { useSettings } from '@/components/SettingsProvider'
import { useStoreMode, getDisplayPrice, getEffectiveMinOrderQty } from '@/contexts/StoreModeContext'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useLocaleNav } from '@/hooks/useLocaleNav'
import { localizeProduct, localizeCategory } from '@/lib/utils/localize'
import { getLocalizedOptionLabel, getLocalizedColorName, getLocalizedCountry, getLocalizedMaterial } from '@/lib/utils/attributeOptionTranslations'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/hooks/useCurrency'
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation'

// A serializable subset of the product API payload (mirrors the page-level
// projection). Extra fields are tolerated via index signature.
interface ProductData {
  id: string
  sku: string
  name: string
  slug: string
  description?: string | null
  price: number
  compareAtPrice?: number | null
  images: string[]
  thumbnail?: string | null
  stock: number
  weightKg: number
  dimensions?: any
  hsCode?: string | null
  countryOfOrigin: string
  material?: string | null
  minOrderQty: number
  wholesalePrice?: number | null
  translations?: any
  category?: {
    id: string
    name: string
    slug: string
    translations?: any
  } | null
  attributes?: Record<string, any> | null
  categoryAttributes?: Array<{
    id: string
    slug: string
    name: string
    inputType: string
    isRequired: boolean
    isFilterable: boolean
    isVisible: boolean
    displayOrder: number
    options?: string[] | null
    colorOptions?: { label: string; value: string }[] | null
  }> | null
  variants?: Array<{
    id: string
    sku: string
    attributes: any
    price: number
    comparePrice?: number | null
    stock: number
    images?: string[]
    isActive?: boolean
  }> | null
  reviews?: Array<{
    id: string
    rating: number
    title: string
    comment: string
    createdAt: any
    user?: { name: string }
  }> | null
}

interface RelatedProduct {
  id: string
  slug: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  stock?: number
  minOrder?: number
  wholesalePrice?: number
  colors?: { label: string; value: string }[]
}

interface ProductDetailViewProps {
  product: ProductData
  slug: string
  locale: string
}

export default function ProductDetailView({
  product,
  slug,
  locale,
}: ProductDetailViewProps) {
  const router = useRouter()
  const navigate = useLocaleNav()
  const { refreshCartCount } = useCart()
  const { formatPrice } = useCurrency()
  const { tBadge } = useStorefrontTranslation()
  const t = useTranslations('Product')
  const tCart = useTranslations('Cart')
  const tProducts = useTranslations('Products') as unknown as (key: string, values?: any) => string

  // Store settings & mode integration
  const { settings } = useSettings()
  const { storeMode, isWholesale, isRetail, isBoth } = useStoreMode()
  const { enableWholesaleSession } = useSessionMode()
  const { addItem: addInquiryItem } = useWholesaleInquiry()
  const { addToQuote } = useQuoteCart()

  const rfqModel = settings?.rfqModel || 'RFQ'
  const isInstantWholesale = rfqModel === 'INSTANT'

  // Variant Management
  const variants = useMemo(() => product.variants || [], [product.variants])

  // Extract all variant dimensions (e.g. ['size', 'color'])
  const optionKeys = useMemo(() => {
    const keys = new Set<string>()
    variants.forEach((v) => {
      if (v.attributes && typeof v.attributes === 'object') {
        Object.keys(v.attributes).forEach((k) => keys.add(k))
      }
    })
    return Array.from(keys)
  }, [variants])

  // Extract unique values per dimension
  const optionValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    optionKeys.forEach((key) => {
      const vals = new Set<string>()
      variants.forEach((v) => {
        const val = v.attributes?.[key]
        if (val) vals.add(String(val))
      })
      map[key] = Array.from(vals)
    })
    return map
  }, [optionKeys, variants])

  // Selected variant options state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  // Initialize selected options to the first available variant on mount or when product changes
  useEffect(() => {
    if (variants.length > 0) {
      const firstVar = variants[0]
      const initial: Record<string, string> = {}
      optionKeys.forEach((k) => {
        if (firstVar.attributes?.[k]) {
          initial[k] = String(firstVar.attributes[k])
        }
      })
      setSelectedOptions(initial)
    } else {
      setSelectedOptions({})
    }
  }, [variants, optionKeys])

  // Find currently matched variant
  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null
    return (
      variants.find((v) => {
        if (!v.attributes) return false
        return Object.entries(selectedOptions).every(
          ([k, val]) => String(v.attributes[k]) === val
        )
      }) || variants[0]
    )
  }, [variants, selectedOptions])

  // Effective price, compare price, stock, SKU, and gallery images
  const currentPrice = selectedVariant?.price ?? product.price
  const currentCompareAtPrice = selectedVariant?.comparePrice ?? product.compareAtPrice
  const currentStock = selectedVariant?.stock ?? product.stock
  const currentSku = selectedVariant?.sku ?? product.sku
  const currentImages = useMemo(() => {
    const list: string[] = []
    // If selected variant has specific photos, show them first
    if (selectedVariant?.images && Array.isArray(selectedVariant.images)) {
      selectedVariant.images.forEach((img) => {
        if (img && typeof img === 'string' && !list.includes(img)) list.push(img)
      })
    }
    // Include all general product gallery images
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && typeof img === 'string' && !list.includes(img)) list.push(img)
      })
    }
    // Include thumbnail if missing
    if (product.thumbnail && !list.includes(product.thumbnail)) {
      list.push(product.thumbnail)
    }
    return list.length > 0 ? list : ['/placeholder-product.png']
  }, [selectedVariant, product.images, product.thumbnail])

  // Review summaries
  const reviewsList = useMemo(() => product.reviews || [], [product.reviews])
  const reviewsCount = reviewsList.length
  const averageRating = useMemo(() => {
    if (reviewsCount === 0) return 5
    return (
      reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0) / reviewsCount
    )
  }, [reviewsList, reviewsCount])

  // Check if apparel/clothing category for size guide
  const isApparelCategory = Boolean(
    product.category?.slug?.includes('apparel') ||
    product.category?.slug?.includes('clothing') ||
    product.category?.slug?.includes('fashion') ||
    product.category?.slug?.includes('shirt') ||
    product.category?.slug?.includes('dress') ||
    product.category?.slug?.includes('shoes')
  )

  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [isSpecificationsExpanded, setIsSpecificationsExpanded] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showQuoteSuccess, setShowQuoteSuccess] = useState(false)
  const [moqError, setMoqError] = useState('')
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [showReturnPolicy, setShowReturnPolicy] = useState(false)

  // Initialize using the store-mode-effective MOQ (product already fetched
  // server-side — no loading skeleton needed on first paint).
  useEffect(() => {
    const effectiveMinQty = getEffectiveMinOrderQty(product.minOrderQty || 1, storeMode)
    setQuantity(effectiveMinQty)
  }, [product.minOrderQty, storeMode])

  useEffect(() => {
    if (slug) {
      fetchRelatedProducts()
    }
  }, [slug])

  const fetchRelatedProducts = async () => {
    try {
      const response = await fetch(`/api/products/${slug}/related?limit=4&locale=${encodeURIComponent(locale)}`)
      const data = await response.json()

      if (data.success) {
        setRelatedProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching related products:', error)
    }
  }

  const handleQuantityChange = (delta: number) => {
    const effectiveMinQty = getEffectiveMinOrderQty(product.minOrderQty, storeMode)
    const newQty = quantity + delta
    if (newQty >= effectiveMinQty && newQty <= currentStock) {
      setQuantity(newQty)
      if (moqError && newQty >= (product.minOrderQty || 1)) setMoqError('')
      // Context B: crossing the wholesale minimum threshold morphs the header
      // anchor to the B2B inquiry basket (only in hybrid mode).
      if (isBoth && product.wholesalePrice && newQty >= product.minOrderQty) {
        enableWholesaleSession()
      }
    }
  }

  const handleAddToCart = async () => {
    try {
      // ✅ MIGRATED TO COOKIE-BASED AUTH - userId extracted from cookie on server
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Send httpOnly cookie
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id,
          quantity
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          alert(t('errors.pleaseLoginCart'))
          navigate('/login')
          return
        }
        throw new Error(tCart('errors.failedAdd'))
      }

      const data = await response.json()

      if (data.success) {
        setShowSuccessMessage(true)
        refreshCartCount()
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccessMessage(false), 3000)
      } else {
        alert(data.error || tCart('errors.failedAdd'))
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert(tCart('errors.failedAdd'))
    } finally {
      setAdding(false)
    }
  }

  // Push the configured variant/specs + MOQ-locked quantity into the B2B
  // inquiry pool. Strictly isolated from the retail cart. MOQ is enforced:
  // any quantity below the product's wholesale minimum is rejected with an
  // inline message and never reaches the inquiry state.
  const handleAddToQuoteList = () => {
    const moq = product.minOrderQty || 1
    if (quantity < moq) {
      setMoqError(t('quoteListMoqError', { n: moq }))
      return
    }
    setMoqError('')
    enableWholesaleSession()

    const variantLabel = selectedVariant && Object.keys(selectedOptions).length > 0
      ? `(${Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')})`
      : ''
    const displayName = variantLabel ? `${product.name} ${variantLabel}` : product.name
    const activeImage = selectedVariant?.images?.[0] || product.thumbnail || product.images?.[0] || null

    addInquiryItem({
      productId: product.id,
      slug: product.slug,
      name: displayName,
      image: activeImage,
      wholesalePrice: product.wholesalePrice || currentPrice,
      retailPrice: currentPrice,
      quantity,
      minOrderQty: moq,
      note: selectedVariant
        ? Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join('; ')
        : product.attributes && Object.keys(product.attributes).length > 0
          ? Object.entries(product.attributes)
              .filter(([, v]) => v)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join('; ')
          : undefined,
    })
    addToQuote({
      productId: product.id,
      productName: displayName,
      productSku: currentSku,
      productImage: activeImage,
      quantity,
      minOrderQty: moq,
      targetPrice: product.wholesalePrice || null,
    })
    setShowQuoteSuccess(true)
    setTimeout(() => setShowQuoteSuccess(false), 3500)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: localized.name,
        text: localized.description,
        url: window.location.href,
      }).catch(() => {
        setShareMenuOpen(!shareMenuOpen)
      })
    } else {
      setShareMenuOpen(!shareMenuOpen)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert(t('messages.linkCopied'))
    setShareMenuOpen(false)
  }

  const handleRequestQuote = () => {
    navigate(`/quotes?product=${slug}`)
  }

  const discount = currentCompareAtPrice
    ? Math.round(((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100)
    : 0

  // Expand-and-Contract Phase 3: resolve localized name/description with
  // en fallback safety. Keeps legacy product fields for pricing/stock/etc.
  const localized = localizeProduct(product, locale)
  const localizedCategoryName = product.category
    ? localizeCategory(product.category, locale).name
    : ''

  const breadcrumbs = [
    { name: tProducts('products'), href: '/products' },
  ]

  if (product.category) {
    breadcrumbs.push({
      name: localizedCategoryName,
      href: `/products?category=${product.category.slug}`
    })
  }

  breadcrumbs.push({
    name: localized.name,
    href: `/products/${product.slug}`
  })

  return (
    <SharedLayout
      showHero={true}
      pageTitle={localized.name}
      pageDescription={localized.description?.substring(0, 150) || `High-quality ${localized.name}`}
      breadcrumbs={breadcrumbs}
    >
      {/* Product JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: localized.name || product.name,
            sku: product.sku,
            image: (product.images && product.images.length > 0 ? product.images : [product.thumbnail]).filter(Boolean),
            description: localized.description || product.description,
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'USD',
              availability: product.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            },
          }),
        }}
      />
      <div className="bg-gradient-to-b from-gray-50 to-white py-4">
        <Container maxWidth="2xl">
          {/* In-Page Clean Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 flex-wrap">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="hover:text-primary-600 transition-colors font-medium"
                >
                  Home
                </button>
              </li>
              {breadcrumbs.map((crumb, idx) => (
                <li key={crumb.href || idx} className="flex items-center gap-1.5 sm:gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-slate-900 line-clamp-1 max-w-[200px] sm:max-w-md">
                      {crumb.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(crumb.href)}
                      className="hover:text-primary-600 transition-colors font-medium"
                    >
                      {crumb.name}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Left Column: Image Gallery */}
            <div className="lg:col-span-6 animate-fade-in">
              <div className="sticky top-20">
                <ProductImageGallery
                  images={currentImages}
                  productName={localized.name}
                />
              </div>
            </div>

          {/* Right Column: Product Info */}
          <div className="lg:col-span-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* Success Message Toast */}
            {showSuccessMessage && (
              <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-slide-in">
                <div className="bg-white rounded-full p-0.5">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t('addedToCart')}</p>
                  <p className="text-xs text-green-100">{t('itemsAdded', { n: quantity })}</p>
                </div>
              </div>
            )}

            {/* Wholesale Quote List success toast */}
            {showQuoteSuccess && (
              <div className="fixed top-20 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-slide-in">
                <div className="bg-white rounded-full p-0.5">
                  <Check className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t('addedToQuoteList')}</p>
                  <p className="text-xs text-blue-100">{t('itemsAdded', { n: quantity })}</p>
                  <button
                    type="button"
                    onClick={() => navigate('/wholesale')}
                    className="text-xs font-bold underline underline-offset-2 mt-0.5 hover:text-white"
                  >
                    {t('viewQuoteList')}
                  </button>
                </div>
              </div>
            )}

            {/* Top Action Bar - Reviews Summary & Wishlist/Share */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        reviewsCount > 0 && star <= Math.round(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <a
                  href="#reviews"
                  className="text-xs text-gray-600 hover:text-primary-600 font-medium transition-colors ml-1"
                >
                  {reviewsCount > 0 ? `${averageRating.toFixed(1)} (${reviewsCount})` : '0 reviews'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <WishlistButton
                  productId={product.id}
                  size="md"
                  className="border border-gray-200 hover:border-red-300 shadow-xs"
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-all hover:scale-105 shadow-xs"
                    aria-label={t('shareProduct')}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {shareMenuOpen && (
                    <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[160px] z-10">
                      <button
                        type="button"
                        onClick={copyLink}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded text-sm transition-colors"
                      >
                         {t('copyLink')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category & SKU */}
            <div className="flex items-center gap-2 mb-2">
              {product.category && (
                <Badge variant="secondary" className="text-sm px-4 py-1.5">
                  {localizedCategoryName}
                </Badge>
              )}
              {currentStock > 100 && (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm px-4 py-1.5 border-0">
                  {t('inHighDemand')}
                </Badge>
              )}
              <span className="text-sm text-gray-500 font-medium">{t('skuLabel')}{currentSku}</span>
            </div>

            {/* Product Name (Primary H1) */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight">{localized.name}</h1>

            {/* Price Section - Store Mode Aware */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-100">
              {(() => {
                const { displayPrice, priceType } = getDisplayPrice(
                  currentPrice,
                  product.wholesalePrice,
                  storeMode
                )

                return (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold text-gradient-gold">
                        {formatPrice(displayPrice)}
                      </span>
                      {priceType === 'wholesale' && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          {t('wholesalePrice')}
                        </Badge>
                      )}
                      {currentCompareAtPrice && (
                        <>
                          <span className="text-lg text-gray-400 line-through">
                            {formatPrice(currentCompareAtPrice)}
                          </span>
                          <Badge variant="destructive" className="text-xs px-2 py-0.5">
                            {t('savePct', { pct: discount })}
                          </Badge>
                        </>
                      )}
                    </div>

                    {priceType === 'retail' && (
                      <p className="text-xs text-gray-600">{t('retailPriceExcl')}</p>
                    )}

                    {priceType === 'wholesale' && (
                      <p className="text-xs text-gray-600">{t('wholesalePriceBusiness')}</p>
                    )}

                    {priceType === 'both' && isBoth && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-1">{t('pricingOptions')}</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{t('retail')}</span>
                            <span className="text-sm font-bold text-gray-900">{formatPrice(currentPrice)}</span>
                          </div>
                          {product.wholesalePrice && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">{t('wholesaleMdq', { n: product.minOrderQty })}</span>
                              <span className="text-sm font-bold text-blue-700">{formatPrice(product.wholesalePrice)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Wholesale Price - Only show in wholesale/both modes */}
            {(isWholesale || isBoth) && product.wholesalePrice && storeMode !== 'RETAIL' && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-300 rounded-lg p-4 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-blue-600 rounded-full p-1.5">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-blue-900">
                    {storeMode === 'WHOLESALE' ? t('wholesalePricing') : t('bulkDiscountAvailable')}
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-700 mb-1">
                  {formatPrice(product.wholesalePrice)}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  {t('minOrderUnits', { n: product.minOrderQty, pct: Math.round((1 - product.wholesalePrice / currentPrice) * 100) })}
                </p>
              </div>
            )}

            {/* Variant Selectors (Size, Color, Capacity, etc.) */}
            {optionKeys.length > 0 && (
              <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100 shadow-sm space-y-4">
                {optionKeys.map((key) => {
                  const values = optionValuesMap[key] || []
                  const selectedVal = selectedOptions[key]
                  const isColor = key.toLowerCase() === 'color'

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {key.charAt(0).toUpperCase() + key.slice(1)}:
                        </span>
                        <span className="text-xs font-semibold text-primary-700">
                          {selectedVal || 'Select'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {values.map((val) => {
                          const isSelected = selectedVal === val
                          const matchingVar = variants.find(
                            (v) =>
                              v.attributes?.[key] === val &&
                              Object.entries(selectedOptions).every(
                                ([k, sVal]) => k === key || v.attributes?.[k] === sVal
                              )
                          )
                          const isAvailable = matchingVar ? matchingVar.stock > 0 : true

                          if (isColor) {
                            const colorMap: Record<string, string> = {
                              black: '#111827',
                              white: '#f9fafb',
                              gold: '#d4af37',
                              silver: '#9ca3af',
                              gray: '#6b7280',
                              grey: '#6b7280',
                              blue: '#2563eb',
                              red: '#dc2626',
                              green: '#16a34a',
                              rose: '#f43f5e',
                            }
                            const hex = colorMap[val.toLowerCase()] || val

                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setSelectedOptions((prev) => ({ ...prev, [key]: val }))}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                  isSelected
                                    ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20 text-primary-900 font-semibold shadow-xs'
                                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                                } ${!isAvailable ? 'opacity-50' : ''}`}
                                title={val}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-xs flex-shrink-0"
                                  style={{ backgroundColor: hex }}
                                />
                                <span>{val}</span>
                              </button>
                            )
                          }

                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSelectedOptions((prev) => ({ ...prev, [key]: val }))}
                              className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'border-primary-600 bg-primary-600 text-white shadow-xs'
                                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                              } ${!isAvailable ? 'opacity-50' : ''}`}
                            >
                              {val}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Stock Status & Scarcity */}
            <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200 shadow-sm space-y-3">
              {currentStock > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 rounded-full p-1.5">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-700 text-sm">{t('inStock')}</p>
                    <p className="text-xs text-gray-600">{t('unitsAvailable', { n: currentStock })}</p>
                  </div>
                  {currentStock <= 50 && (
                    <Badge variant="destructive" className="animate-pulse bg-red-100 text-red-700 border-red-200 hover:bg-red-200">
                      {t('onlyLeft', { n: currentStock })}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="bg-red-100 rounded-full p-1.5">
                    <Package className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-700 text-sm">{t('outOfStock')}</p>
                    <p className="text-xs text-gray-600">{t('contactRestock')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector - Store Mode Aware */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              {(() => {
                const effectiveMinQty = getEffectiveMinOrderQty(product.minOrderQty, storeMode)

                return (
                  <>
                    <label htmlFor="product-quantity" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('selectQuantity')}
                      {effectiveMinQty > 1 && (
                        <span className="text-xs text-gray-600 font-normal ml-1">
                          ({t('minUnits', { n: effectiveMinQty })})
                        </span>
                      )}
                      {storeMode === 'RETAIL' && product.minOrderQty > 1 && (
                        <span className="text-xs text-green-600 font-normal ml-2">
                          ✓ {t('retailNoMin')}
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-3 mb-3">
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= effectiveMinQty}
                        aria-label="Decrease quantity"
                        className="h-10 w-10 rounded-lg border hover:border-primary-500 hover:bg-primary-50"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <input
                        id="product-quantity"
                        type="number"
                        aria-label={t('selectQuantity')}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          if (val >= effectiveMinQty && val <= currentStock) {
                            setQuantity(val)
                          }
                        }}
                        min={effectiveMinQty}
                        max={currentStock}
                        className="w-20 text-center border border-gray-300 rounded-lg py-2 text-base font-bold focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition-all"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= currentStock}
                        aria-label="Increase quantity"
                        className="h-10 w-10 rounded-lg border hover:border-primary-500 hover:bg-primary-50"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="bg-white rounded-md p-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium text-sm">{t('subtotal')}</span>
                        <span className="text-xl font-bold text-primary-600">
                          {formatPrice(currentPrice * quantity)}
                        </span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Action Buttons - Store-mode gated (B2B/B2C separation) */}
            <div className="flex flex-col gap-3 mb-6">
              {/* B2C Retail path: hidden entirely in pure WHOLESALE mode so
                  wholesale customers cannot bypass MOQ via the retail cart. */}
              {isRetail && (
                <Button
                  size="lg"
                  className="relative w-full h-12 text-base font-bold shadow-[0_8px_30px_rgb(26,58,92,0.2)] hover:shadow-[0_8px_30px_rgb(26,58,92,0.3)] transition-all rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-[length:200%_auto] hover:bg-right hover:scale-[1.02] overflow-hidden group"
                  onClick={handleAddToCart}
                  disabled={currentStock === 0 || adding}
                >
                  <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {adding ? t('addingToCart') : t('addToCart')}
                </Button>
              )}
              {/* B2B Wholesale path: primary action in pure WHOLESALE mode.
                  Adds the MOQ-locked variant/specs to the B2B inquiry pool
                  (strictly isolated from the retail cart) and shows success
                  feedback with a link to the Quote List. */}
              <Button
                size="lg"
                variant={isWholesale && !isRetail ? 'default' : 'outline'}
                className={
                  isWholesale && !isRetail
                    ? 'relative w-full h-12 text-base font-bold shadow-[0_8px_30px_rgb(26,58,92,0.2)] hover:shadow-[0_8px_30px_rgb(26,58,92,0.3)] transition-all rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-[length:200%_auto] hover:bg-right hover:scale-[1.02] overflow-hidden group'
                    : 'w-full h-11 text-base font-semibold border-2 border-primary-600 text-primary-700 hover:bg-primary-50 rounded-lg transition-all'
                }
                onClick={handleAddToQuoteList}
                disabled={currentStock === 0}
              >
                <FileText className="w-5 h-5 mr-2" />
                {isInstantWholesale ? ((t as any)('addToWholesaleCart') || 'Add to Wholesale Cart') : t('addToQuoteList')}
              </Button>

              {/* Inline MOQ validation message */}
              {moqError && (
                <p className="text-xs font-medium text-red-600 -mt-1">{moqError}</p>
              )}

              {/* Secondary: open the formal quote request form */}
              <button
                type="button"
                onClick={handleRequestQuote}
                className="w-full text-center text-sm font-medium text-primary-700 hover:text-primary-800 underline-offset-2 hover:underline transition-colors"
              >
                {t('requestWholesaleQuote')}
              </button>
            </div>

            {/* Trust Badges - Compact */}
            <TrustBadgesMini className="mb-4" />

            {/* Delivery Estimate - Compact */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 mb-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <div className="bg-blue-500 rounded-full p-1.5 mt-0.5">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-0.5 text-sm">{t('estimatedDelivery')}</h3>
                  <p className="text-xs text-gray-700 mb-1">
                    {t('getItBy')} <span className="font-bold text-blue-700">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> - <span className="font-bold text-blue-700">{new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-blue-600">
                    <Check className="w-3 h-3" />
                    <span>{t('freeShippingOver')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section: Description & Specifications */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Product Description */}
          <div className="lg:col-span-6">
            <Card className="h-full shadow-md border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3">
                <h2 className="text-lg font-bold" style={{ color: 'rgb(26, 58, 92)' }}>{t('productDescription')}</h2>
              </div>
              <CardContent className="pt-5 px-4 pb-4">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {localized.description || t('noDescription')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Specifications Card */}
          <div className="lg:col-span-6">
            <Card className="h-full shadow-md border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'rgb(26, 58, 92)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'rgb(26, 58, 92)' }} />
                  {t('specifications')}
                </h2>
              </div>
              <CardContent className="p-4 bg-gradient-to-br from-white to-gray-50">
                <dl className="space-y-0.5">{/* Build complete specifications array first */}
                  {(() => {
                    const allSpecs: JSX.Element[] = []
                    let renderedDimensions = false

                    // Product Attributes from Category
                    if (product.attributes && Object.entries(product.attributes).length > 0) {
                      if (product.categoryAttributes && product.categoryAttributes.length > 0) {
                        product.categoryAttributes
                          .filter(attr => {
                            const value = product.attributes?.[attr.slug]
                            if (!value) return false
                            if (Array.isArray(value) && value.length === 0) return false
                            return true
                          })
                          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                          .forEach((attr, idx) => {
                            const value = product.attributes?.[attr.slug]
                            if (!value) return

                            if (attr.slug === 'dimensions' || attr.slug === 'dimensions_lwh') {
                              renderedDimensions = true
                            }

                            const isColorType = attr.inputType === 'COLOR' || attr.inputType === 'COLOR_MULTI' || attr.slug === 'color' || attr.slug.endsWith('_color')
                            const colorOpts = attr.colorOptions || []

                            // Color attribute — show swatches with localized names
                            if (isColorType) {
                              let colorVals: string[] = []
                              if (Array.isArray(value)) {
                                colorVals = value
                              } else if (typeof value === 'string') {
                                if (value.startsWith('[') && value.endsWith(']')) {
                                  try {
                                    const parsed = JSON.parse(value)
                                    if (Array.isArray(parsed)) colorVals = parsed
                                  } catch {
                                    colorVals = [value]
                                  }
                                } else if (value.includes(',')) {
                                  colorVals = value.split(',').map((s: string) => s.trim()).filter(Boolean)
                                } else {
                                  colorVals = [value]
                                }
                              }

                              allSpecs.push(
                                <div key={attr.slug ?? `color-${idx}`} className="py-2 border-b border-gray-200 last:border-0 hover:bg-white px-2 rounded transition-colors">
                                  <div className="flex justify-between items-start gap-2">
                                    <dt className="text-gray-700 font-semibold flex-shrink-0 text-xs">{attr.name}</dt>
                                    <dd className="flex flex-wrap gap-1.5 justify-end">
                                      {colorVals.map((hex: string, ci) => {
                                        const cleanHex = hex.trim()
                                        const rawLabel = colorOpts.find((c: any) => c.value?.toLowerCase() === cleanHex.toLowerCase())?.label
                                        const label = getLocalizedColorName(cleanHex, rawLabel, locale)
                                        const isHex = cleanHex.startsWith('#')
                                        return (
                                          <div
                                            key={cleanHex ?? `color-val-${idx}-${ci}`}
                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-gray-200 shadow-2xs text-xs font-semibold text-gray-800"
                                          >
                                            {isHex && (
                                              <span
                                                className="inline-block w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs flex-shrink-0"
                                                style={{ backgroundColor: cleanHex }}
                                                title={label}
                                              />
                                            )}
                                            <span>{label}</span>
                                          </div>
                                        )
                                      })}
                                    </dd>
                                  </div>
                                </div>
                              )
                            } else {
                              // Regular attribute — text display with boolean and option translation fallback
                              const isBool = attr.inputType === 'CHECKBOX' || typeof value === 'boolean' || value === 'true' || value === 'false' || value === 'Требуется' || value === 'Не требуется' || value === 'Да' || value === 'Нет'
                              let displayValue: any
                              if (isBool) {
                                const isTrue = value === true || value === 'true' || value === 'Требуется' || value === 'Да' || value === 'yes' || value === '1' || value === '需要组装' || value === '是'
                                if (attr.slug === 'assembly_required') {
                                  displayValue = isTrue ? (locale === 'ru' ? 'Требуется' : locale === 'zh' ? '需要组装' : 'Yes') : (locale === 'ru' ? 'Не требуется' : locale === 'zh' ? '无需组装' : 'No')
                                } else {
                                  displayValue = isTrue ? (locale === 'ru' ? 'Да' : locale === 'zh' ? '是' : 'Yes') : (locale === 'ru' ? 'Нет' : locale === 'zh' ? '否' : 'No')
                                }
                              } else if (Array.isArray(value)) {
                                displayValue = value.map((v: any) => getLocalizedOptionLabel(attr.slug, String(v), locale)).join(', ')
                              } else {
                                displayValue = getLocalizedOptionLabel(attr.slug, String(value), locale)
                              }

                              allSpecs.push(
                                <div key={attr.slug ?? `spec-${idx}`} className="flex justify-between items-center py-2 px-2 border-b border-gray-200 last:border-0 hover:bg-white rounded transition-colors">
                                  <dt className="text-gray-700 font-semibold text-xs">{attr.name}</dt>
                                  <dd className="font-bold text-gray-900 text-xs">{displayValue}</dd>
                                </div>
                              )
                            }
                          })
                      } else {
                        Object.entries(product.attributes)
                          .filter(([, value]) => !!value && !(Array.isArray(value) && value.length === 0))
                          .forEach(([key, value]) => {
                            if (key === 'dimensions' || key === 'dimensions_lwh') {
                              renderedDimensions = true
                            }

                            const isColor = key === 'color' || key.endsWith('_color')
                            if (isColor) {
                              let colorVals: string[] = []
                              if (Array.isArray(value)) {
                                colorVals = value
                              } else if (typeof value === 'string') {
                                if (value.startsWith('[') && value.endsWith(']')) {
                                  try {
                                    const p = JSON.parse(value)
                                    if (Array.isArray(p)) colorVals = p
                                  } catch {
                                    colorVals = [value]
                                  }
                                } else if (value.includes(',')) {
                                  colorVals = value.split(',').map((s: string) => s.trim()).filter(Boolean)
                                } else {
                                  colorVals = [value]
                                }
                              }

                              allSpecs.push(
                                <div key={key} className="py-2 border-b border-gray-200 last:border-0 hover:bg-white px-2 rounded transition-colors">
                                  <div className="flex justify-between items-start gap-2">
                                    <dt className="text-gray-700 font-semibold flex-shrink-0 text-xs">
                                      {locale === 'ru' ? 'Цвет' : locale === 'zh' ? '颜色' : 'Color'}
                                    </dt>
                                    <dd className="flex flex-wrap gap-1.5 justify-end">
                                      {colorVals.map((hex: string, ci) => {
                                        const cleanHex = hex.trim()
                                        const label = getLocalizedColorName(cleanHex, undefined, locale)
                                        const isHex = cleanHex.startsWith('#')
                                        return (
                                          <div
                                            key={cleanHex ?? `color-val-${ci}`}
                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-gray-200 shadow-2xs text-xs font-semibold text-gray-800"
                                          >
                                            {isHex && (
                                              <span
                                                className="inline-block w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs flex-shrink-0"
                                                style={{ backgroundColor: cleanHex }}
                                              />
                                            )}
                                            <span>{label}</span>
                                          </div>
                                        )
                                      })}
                                    </dd>
                                  </div>
                                </div>
                              )
                            } else {
                              const displayName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
                              const isBool = typeof value === 'boolean' || value === 'true' || value === 'false' || key === 'assembly_required' || value === 'Требуется' || value === 'Не требуется' || value === 'Да' || value === 'Нет'
                              let displayValue: any
                              if (isBool) {
                                const isTrue = value === true || value === 'true' || value === 'Требуется' || value === 'Да' || value === 'yes' || value === '1' || value === '需要组装' || value === '是'
                                if (key === 'assembly_required') {
                                  displayValue = isTrue ? (locale === 'ru' ? 'Требуется' : locale === 'zh' ? '需要组装' : 'Yes') : (locale === 'ru' ? 'Не требуется' : locale === 'zh' ? '无需组装' : 'No')
                                } else {
                                  displayValue = isTrue ? (locale === 'ru' ? 'Да' : locale === 'zh' ? '是' : 'Yes') : (locale === 'ru' ? 'Нет' : locale === 'zh' ? '否' : 'No')
                                }
                              } else if (Array.isArray(value)) {
                                displayValue = value.map((v: any) => getLocalizedOptionLabel(key, String(v), locale)).join(', ')
                              } else {
                                displayValue = getLocalizedOptionLabel(key, String(value), locale)
                              }

                              allSpecs.push(
                                <div key={key} className="flex justify-between items-center py-2 px-2 border-b border-gray-200 last:border-0 hover:bg-white rounded transition-colors">
                                  <dt className="text-gray-700 font-semibold text-xs">{displayName}</dt>
                                  <dd className="font-bold text-gray-900 text-xs">{displayValue}</dd>
                                </div>
                              )
                            }
                          })
                      }
                    }

                    // Basic Product Info
                    allSpecs.push(
                      <div key="weight" className="flex justify-between py-2 px-2 border-b border-gray-200 hover:bg-white rounded transition-colors">
                        <dt className="text-gray-700 font-semibold text-xs">{t('specWeight')}</dt>
                        <dd className="font-bold text-gray-900 text-xs">{product.weightKg} {locale === 'ru' ? 'кг' : locale === 'zh' ? '千克' : 'kg'}</dd>
                      </div>
                    )

                    if (product.hsCode) {
                      allSpecs.push(
                        <div key="hsCode" className="flex justify-between py-2 px-2 border-b border-gray-200 hover:bg-white rounded transition-colors">
                          <dt className="text-gray-700 font-semibold text-xs">{t('specHsCode')}</dt>
                          <dd className="font-bold text-gray-900 text-xs">{product.hsCode}</dd>
                        </div>
                      )
                    }

                    if (product.countryOfOrigin) {
                      allSpecs.push(
                        <div key="origin" className="flex justify-between py-2 px-2 border-b border-gray-200 hover:bg-white rounded transition-colors">
                          <dt className="text-gray-700 font-semibold text-xs">{t('specOrigin')}</dt>
                          <dd className="font-bold text-gray-900 text-xs">{getLocalizedCountry(product.countryOfOrigin, locale)}</dd>
                        </div>
                      )
                    }

                    if (product.material) {
                      allSpecs.push(
                        <div key="material" className="flex justify-between py-2 px-2 border-b border-gray-200 hover:bg-white rounded transition-colors">
                          <dt className="text-gray-700 font-semibold text-xs">{t('specMaterial')}</dt>
                          <dd className="font-bold text-gray-900 text-xs">{getLocalizedMaterial(product.material, locale)}</dd>
                        </div>
                      )
                    }

                    if (product.dimensions && !renderedDimensions) {
                      allSpecs.push(
                        <div key="dimensions" className="flex justify-between py-2 px-2 hover:bg-white rounded transition-colors">
                          <dt className="text-gray-700 font-semibold text-xs">{t('specDimensions')}</dt>
                          <dd className="font-bold text-gray-900 text-xs">
                            {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {locale === 'ru' ? 'см' : locale === 'zh' ? '厘米' : 'cm'}
                          </dd>
                        </div>
                      )
                    }

                    // Show preview (first 5 items) or all items
                    const previewCount = 5
                    const specsToShow = isSpecificationsExpanded ? allSpecs : allSpecs.slice(0, previewCount)
                    const hasMore = allSpecs.length > previewCount

                    return (
                      <>
                        {specsToShow}
                        {hasMore && (
                          <div className="pt-3">
                            <button
                              onClick={() => setIsSpecificationsExpanded(!isSpecificationsExpanded)}
                              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-800 font-semibold rounded-lg transition-all shadow-sm hover:shadow text-sm"
                            >
                                {isSpecificationsExpanded ? (
                                  <>
                                    <span>{t('showLess')}</span>
                                    <ChevronUp className="w-4 h-4" />
                                  </>
                                ) : (
                                  <>
                                    <span>{t('showAllMore', { n: allSpecs.length - previewCount })}</span>
                                    <ChevronDown className="w-4 h-4" />
                                  </>
                                )}
                            </button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Features Section - Compact */}
        <div className={`grid grid-cols-1 ${isApparelCategory ? 'lg:grid-cols-3' : 'sm:grid-cols-2'} gap-4 mt-4 mb-6`}>
          {/* Ask a Question */}
          <Card className="shadow-sm border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowQuestionForm(!showQuestionForm)}>
            <CardContent className="px-4 pt-6 pb-5">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 rounded-full p-2 flex-shrink-0">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-0.5 text-sm">{t('haveQuestions')}</h3>
                  <p className="text-xs text-gray-600 mb-2">{t('expertsHelp')}</p>
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    {t('askAQuestion')}
                    <ChevronDown className={`w-3 h-3 transition-transform ${showQuestionForm ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              {showQuestionForm && (
                <div className="mt-3 pt-3 border-t border-gray-200 animate-fade-in">
                  <textarea
                    placeholder={t('questionPlaceholder')}
                    className="w-full border border-gray-300 rounded-md p-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                    rows={3}
                  />
                  <Button size="sm" className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-xs h-8">
                    {t('submitQuestion')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Size Guide - Only shown for apparel / clothing items */}
          {isApparelCategory && (
            <Card className="shadow-sm border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowSizeGuide(!showSizeGuide)}>
              <CardContent className="px-4 pt-6 pb-5">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-50 rounded-full p-2 flex-shrink-0">
                    <Ruler className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-0.5 text-sm">{t('sizeGuide')}</h3>
                    <p className="text-xs text-gray-600 mb-2">{t('findFit')}</p>
                    <button className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                      {t('viewSizeChart')}
                      <ChevronDown className={`w-3 h-3 transition-transform ${showSizeGuide ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                {showSizeGuide && (
                  <div className="mt-3 pt-3 border-t border-gray-200 animate-fade-in">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1.5 text-left font-semibold">{t('sizeHeader')}</th>
                            <th className="px-2 py-1.5 text-left font-semibold">US</th>
                            <th className="px-2 py-1.5 text-left font-semibold">EU</th>
                            <th className="px-2 py-1.5 text-left font-semibold">UK</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr><td className="px-2 py-1.5">S</td><td className="px-2 py-1.5">6-8</td><td className="px-2 py-1.5">36-38</td><td className="px-2 py-1.5">8-10</td></tr>
                          <tr><td className="px-2 py-1.5">M</td><td className="px-2 py-1.5">8-10</td><td className="px-2 py-1.5">38-40</td><td className="px-2 py-1.5">10-12</td></tr>
                          <tr><td className="px-2 py-1.5">L</td><td className="px-2 py-1.5">10-12</td><td className="px-2 py-1.5">40-42</td><td className="px-2 py-1.5">12-14</td></tr>
                          <tr><td className="px-2 py-1.5">XL</td><td className="px-2 py-1.5">12-14</td><td className="px-2 py-1.5">42-44</td><td className="px-2 py-1.5">14-16</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Return Policy */}
          <Card className="shadow-sm border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowReturnPolicy(!showReturnPolicy)}>
            <CardContent className="px-4 pt-6 pb-5">
              <div className="flex items-start gap-3">
                <div className="bg-green-50 rounded-full p-2 flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-0.5 text-sm">{t('easyReturns')}</h3>
                  <p className="text-xs text-gray-600 mb-2">{t('returnPolicy30')}</p>
                  <button className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                    {t('learnMore')}
                    <ChevronDown className={`w-3 h-3 transition-transform ${showReturnPolicy ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              {showReturnPolicy && (
                <div className="mt-3 pt-3 border-t border-gray-200 animate-fade-in">
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{t('returnWindow')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{t('freeReturnShipping')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{t('fullRefund')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{t('noQuestions')}</span>
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Support Callout - Compact */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-5 mb-6 shadow-md border border-blue-500 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2.5 backdrop-blur-sm border border-white/30">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold mb-0.5 text-white">{t('needHelp')}</h3>
                <p className="text-blue-100 text-sm">{t('chat247')}</p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => navigate('/contact')}
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6 shadow-md hover:shadow-lg transition-all text-sm h-10"
            >
                <MessageCircle className="w-4 h-4 mr-2" />
                {t('startLiveChat')}
            </Button>
          </div>
        </div>

        {/* Related Products Section - Compact */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-0.5">{t('youMayAlsoLike')}</h2>
                <p className="text-gray-600 text-sm">{t('discoverSimilar')}</p>
              </div>
              {product.category && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/products?category=${product.category?.slug}`)}
                  className="border border-primary-600 text-primary-700 hover:bg-primary-50 font-semibold rounded-lg px-4 text-sm h-9"
                >
                  {t('viewAllIn', { name: localizedCategoryName })}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  onAddToCart={async (productId) => {
                    if (isWholesale && !isRetail) {
                      const target = relatedProducts.find((p) => p.id === productId) || relatedProduct
                      const moq = target.minOrder || (target as any).minOrderQty || 1
                      enableWholesaleSession()
                      addInquiryItem({
                        productId: target.id,
                        slug: target.slug,
                        name: target.name,
                        image: target.image,
                        wholesalePrice: (target.wholesalePrice || target.price) as number,
                        retailPrice: target.price,
                        quantity: moq,
                        minOrderQty: moq,
                      })
                      addToQuote({
                        productId: target.id,
                        productName: target.name,
                        productSku: (target as any).sku || target.slug || target.id,
                        productImage: target.image,
                        quantity: moq,
                        minOrderQty: moq,
                      })
                      return
                    }

                    try {
                      // ✅ MIGRATED TO COOKIE-BASED AUTH - cookies sent automatically
                      const response = await fetch('/api/cart', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          productId,
                          quantity: 1
                        })
                      })

                      if (!response.ok) {
                        if (response.status === 401) {
                          alert(t('errors.pleaseLoginCart'))
                          navigate('/login')
                          return
                        }
                        throw new Error('Failed to add item')
                      }

                      const data = await response.json()

                      if (data.success) {
                        refreshCartCount()
                      } else {
                        alert(data.error || tCart('errors.failedAdd'))
                      }
                    } catch (error) {
                      console.error('Error adding to cart:', error)
                      alert(tCart('errors.failedAdd'))
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Customer Reviews and FAQ Section - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Customer Reviews Section - Dynamic */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <ReviewSection productId={product.id} productName={localized.name} />
          </div>

          {/* FAQ Section - Compact */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-900 mb-0.5">{t('faqTitle')}</h2>
            <p className="text-gray-600 text-xs">{t('faqSubtitle')}</p>
          </div>

          <div className="space-y-2">
            {[
              {
                q: t('faq1q'),
                a: t('faq1a', { n: product.minOrderQty })
              },
              {
                q: t('faq2q'),
                a: t('faq2a')
              },
              {
                q: t('faq3q'),
                a: t('faq3a')
              },
              {
                q: t('faq4q'),
                a: t('faq4a')
              },
              {
                q: t('faq5q'),
                a: t('faq5a')
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                <div className="flex items-start gap-2">
                  <div className="bg-primary-100 rounded-full p-1.5 flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-0.5 text-sm">{faq.q}</h4>
                    <p className="text-gray-700 leading-relaxed text-xs">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 rounded-full p-1.5">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-0 text-xs">{t('faqStillQuestions')}</h4>
                <p className="text-gray-700 text-xs">{t('supportReady')}</p>
              </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 text-xs h-8">
                  {t('contactSupport')}
                </Button>
            </div>
          </div>
        </div>
        </div>
      </Container>
    </div>
    </SharedLayout>
  )
}