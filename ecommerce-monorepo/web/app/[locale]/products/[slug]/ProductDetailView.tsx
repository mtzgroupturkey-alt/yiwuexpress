'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/design-system/Container'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { ProductImageGallery } from '@/components/products/ProductImageGallery'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart, Minus, Plus, Package, Truck, ArrowLeft, ArrowRight, Copy, FileText, ChevronDown, ChevronUp, ChevronRight, Share2, Star, Check, Download, ExternalLink, Info, CheckCircle, MessageCircle, Ruler, RefreshCw, HelpCircle, ShieldCheck, Box, Sparkles, Zap, CreditCard, Flame, Heart, Layers, LogIn, PenLine } from 'lucide-react'
import { LocaleLink } from '@/components/LocaleLink'
import { UnifiedProductCard } from '@/app/[locale]/design-3/components/UnifiedProductCard'
import { ProductImage } from '@/components/ui/ProductImage'
import { NewsletterBar } from '@/app/[locale]/design-3/components/NewsletterBar'
import { MotionReveal } from '@/components/motion/MotionReveal'
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter'
import { useWishlist } from '@/hooks/useWishlist'
import { motion } from 'framer-motion'
import { ReviewSection } from '@/components/products/ReviewSection'
import { TrustBadgesMini } from '@/components/TrustBadgesMini'
import { WishlistButton } from '@/components/products/WishlistButton'
import { useCart } from '@/components/CartContext'
import { useQuoteCart } from '@/components/QuoteCartContext'
import { useSettings } from '@/components/SettingsProvider'
import { useStoreMode, getDisplayPrice, getEffectiveMinOrderQty } from '@/contexts/StoreModeContext'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { useCustomerView } from '@/hooks/useCustomerView'
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useLocaleNav } from '@/hooks/useLocaleNav'
import { localizeProduct, localizeCategory, cleanLocalizedDescription } from '@/lib/utils/localize'
import {
  getLocalizedOptionLabel,
  getLocalizedColorName,
  getLocalizedCountry,
  getLocalizedMaterial,
  resolveLocalizedAttributeValue,
} from '@/lib/utils/attributeOptionTranslations'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/hooks/useCurrency'
import { getProductDisplayNames } from '@/lib/utils/productNames'
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation'
import { StickyBuyBar } from '@/components/mobile/StickyBuyBar'
import { MobileProductDetailView } from '@/components/mobile/product/MobileProductDetailView'
import { useMobile } from '@/components/MobileProvider'
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation'
import { useAuth } from '@/hooks/useAuth'

// A serializable subset of the product API payload (mirrors the page-level
// projection). Extra fields are tolerated via index signature.
interface ProductData {
  id: string
  sku: string
  dromkokItemNo?: string | null
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
    isVariant?: boolean
    isVisible: boolean
    displayOrder: number
    options?: string[] | null
    rawOptions?: string[] | null
    colorOptions?: { label: string; value: string }[] | null
    rawColorOptions?: { label: string; value: string }[] | null
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
  ikeaItemNumber?: string | null
  taxRate?: number | null
  taxPercent?: number | null
  priceWithTax?: number | null
  wholesalePriceWithTax?: number | null
  rawIkeaPayload?: any | null
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

import type { ProductRatingSummary } from '@/lib/reviews/rating'

interface ProductDetailViewProps {
  product: ProductData
  slug: string
  locale: string
  ratingSummary?: ProductRatingSummary
}

export default function ProductDetailView({
  product,
  slug,
  locale,
  ratingSummary,
}: ProductDetailViewProps) {
  // Resolve localized name/description with en fallback safety
  const localized = localizeProduct(product, locale)
  const localizedCategoryName = product.category
    ? localizeCategory(product.category, locale).name
    : ''

  const router = useRouter()
  const navigate = useLocaleNav()
  const { isAuthenticated } = useAuth()
  const { refreshCartCount } = useCart()
  const { formatPrice } = useCurrency()
  const { tBadge, tPdp } = useStorefrontTranslation()
  const t = useTranslations('Product')
  const tCart = useTranslations('Cart')
  const tProducts = useTranslations('Products') as unknown as (key: string, values?: any) => string

  // Store settings & mode integration
  const { settings, storeMode: systemStoreMode } = useSettings()
  const { storeMode: ctxStoreMode, storeMode, isWholesale, isRetail, isBoth } = useStoreMode()
  const customerView = useCustomerView()
  const isWholesaleCustomer = customerView.isWholesale
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const isUserLoggedIn = mounted
    ? (isAuthenticated || (!customerView.isGuest && (customerView.isRetail || customerView.isWholesale)))
    : false
  const { sessionMode, isWholesaleSession, enableWholesaleSession } = useSessionMode()
  const { addItem: addInquiryItem } = useWholesaleInquiry()
  const { addToQuote } = useQuoteCart()

  const currentStoreMode = ctxStoreMode || systemStoreMode || 'WHOLESALE'
  // Strictly conditioned on customer view:
  const isWholesaleActive = customerView.isWholesale

  const rfqModel = settings?.rfqModel || 'RFQ'
  const isInstantWholesale = rfqModel === 'INSTANT'
  const moq = product.minOrderQty || (product as any).moq || settings?.wholesaleDefaultMoq || 1
  const effectiveMinQty = isWholesaleActive ? moq : 1

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

  // Configurable Attributes (when product has multi-value attributes or isVariant=true but no ProductVariant records)
  const configurableAttributes = useMemo(() => {
    if (variants.length > 0) return []

    const list: Array<{
      slug: string
      name: string
      type: string
      isColor: boolean
      options: Array<{ value: string; label: string; hex?: string }>
    }> = []

    const catAttrs = product.categoryAttributes || []
    const prodAttrs = product.attributes || {}

    catAttrs.forEach((ca) => {
      if ((ca as any).isVisible === false || (ca as any).isActive === false) return
      const val = prodAttrs[ca.slug]
      const hasMultiValue = Array.isArray(val) && val.length > 1
      const isVariant = ca.isVariant ?? false
      const isColor = ca.inputType === 'COLOR' || ca.slug === 'color' || ca.slug.endsWith('_color')

      if (isVariant || hasMultiValue) {
        let optionsList: Array<{ value: string; label: string; hex?: string }> = []

        if (Array.isArray(val) && val.length > 0) {
          optionsList = val.map((v: any) => {
            const strVal = typeof v === 'string' ? v : String(v?.value || v)
            const strLabel = typeof v === 'object' && v?.label ? v.label : strVal
            if (isColor) {
              const hex = strVal.startsWith('#') ? strVal : undefined
              return { value: strVal, label: getLocalizedColorName(strVal, strLabel, locale as any), hex: hex || strVal }
            }
            return { value: strVal, label: getLocalizedOptionLabel(ca.slug, strLabel, locale as any) }
          })
        } else if (typeof val === 'string' && val.trim().length > 0) {
          const strVal = val.trim()
          if (isColor) {
            optionsList = [{ value: strVal, label: getLocalizedColorName(strVal, strVal, locale as any), hex: strVal }]
          } else {
            optionsList = [{ value: strVal, label: getLocalizedOptionLabel(ca.slug, strVal, locale as any) }]
          }
        } else if (isVariant && (ca.options?.length || ca.colorOptions?.length)) {
          if (isColor && ca.colorOptions && ca.colorOptions.length > 0) {
            optionsList = ca.colorOptions.map((co: any) => ({
              value: co.value,
              label: co.label || co.value,
              hex: co.value
            }))
          } else if (ca.options && ca.options.length > 0) {
            optionsList = ca.options.map((opt: string) => ({
              value: opt,
              label: opt
            }))
          }
        }

        if (optionsList.length > 0) {
          list.push({
            slug: ca.slug,
            name: ca.name,
            type: ca.inputType,
            isColor,
            options: optionsList
          })
        }
      }
    })

    // Also check prodAttrs directly for any other array attributes not in catAttrs
    Object.entries(prodAttrs).forEach(([key, val]) => {
      if (Array.isArray(val) && val.length > 1 && !list.some((a) => a.slug === key)) {
        const isColor = key.toLowerCase().includes('color')
        const optionsList = val.map((v: any) => {
          const strVal = typeof v === 'string' ? v : String(v?.value || v)
          const strLabel = typeof v === 'object' && v?.label ? v.label : strVal
          if (isColor) {
            return { value: strVal, label: getLocalizedColorName(strVal, strLabel, locale as any), hex: strVal }
          }
          return { value: strVal, label: getLocalizedOptionLabel(key, strLabel, locale as any) }
        })
        const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        list.push({
          slug: key,
          name: displayName,
          type: isColor ? 'COLOR' : 'SELECT',
          isColor,
          options: optionsList
        })
      }
    })

    return list
  }, [variants, product.categoryAttributes, product.attributes, locale])

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
    } else if (configurableAttributes.length > 0) {
      const initial: Record<string, string> = {}
      configurableAttributes.forEach((ca) => {
        if (ca.options.length > 0) {
          initial[ca.slug] = ca.options[0].value
        }
      })
      setSelectedOptions(initial)
    } else {
      setSelectedOptions({})
    }
  }, [variants, optionKeys, configurableAttributes])

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

  const effectiveWholesalePrice =
    (selectedVariant as any)?.wholesalePrice ?? product.wholesalePrice ?? currentPrice

  const hasWholesalePrice = Boolean(product.wholesalePrice && product.wholesalePrice > 0)
  const isWholesalePricing = isWholesaleActive && hasWholesalePrice

  const displayPrice = isWholesalePricing ? effectiveWholesalePrice : currentPrice
  const priceType: 'retail' | 'wholesale' | 'both' = isWholesalePricing
    ? 'wholesale'
    : isBoth
    ? 'both'
    : 'retail'

  const showOriginalPrice = isWholesalePricing
    ? null
    : currentCompareAtPrice && currentCompareAtPrice > displayPrice
    ? currentCompareAtPrice
    : null

  const effectiveTaxRate = useMemo(() => {
    const rawTax =
      product.taxRate ??
      product.taxPercent ??
      (product.rawIkeaPayload as any)?.taxRate ??
      (product.rawIkeaPayload as any)?.taxPercent
    if (rawTax !== undefined && rawTax !== null && !isNaN(Number(rawTax)) && Number(rawTax) > 0) {
      return Number(rawTax)
    }
    return 0
  }, [product])

  const effectiveDisplayPriceWithTax = useMemo(() => {
    if (priceType === 'wholesale') {
      if (product.wholesalePriceWithTax && product.wholesalePriceWithTax > 0) {
        return product.wholesalePriceWithTax
      }
      if (effectiveTaxRate > 0 && displayPrice > 0) {
        return Math.round((displayPrice * (1 + effectiveTaxRate / 100) + Number.EPSILON) * 100) / 100
      }
    }
    return null
  }, [priceType, product.wholesalePriceWithTax, effectiveTaxRate, displayPrice])
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
    return list.length > 0 ? list : ['/images/product-placeholder.webp']
  }, [selectedVariant, product.images, product.thumbnail])

  // Review summaries derived from server aggregation or product reviews
  const reviewsList = useMemo(() => product.reviews || [], [product.reviews])
  const reviewsCount = ratingSummary !== undefined ? ratingSummary.count : reviewsList.length
  const averageRating = useMemo(() => {
    if (ratingSummary !== undefined) {
      return ratingSummary.average
    }
    if (reviewsCount === 0) return 0
    return (
      Math.round((reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0) / reviewsCount) * 10) / 10
    )
  }, [ratingSummary, reviewsList, reviewsCount])

  // Check if apparel/clothing category for size guide
  const isApparelCategory = Boolean(
    product.category?.slug?.includes('apparel') ||
    product.category?.slug?.includes('clothing') ||
    product.category?.slug?.includes('fashion') ||
    product.category?.slug?.includes('shirt') ||
    product.category?.slug?.includes('dress') ||
    product.category?.slug?.includes('shoes')
  )

  const [matrixQuantities, setMatrixQuantities] = useState<Record<string, number>>({})

  // Matrix items for Wholesale Assortment ordering
  const matrixItems = useMemo(() => {
    if (variants.length > 0) {
      return variants.map((v) => {
        const attrLabel = v.attributes && typeof v.attributes === 'object'
          ? Object.entries(v.attributes).map(([, val]) => `${val}`).join(' / ')
          : v.sku
        return {
          id: v.id,
          sku: v.sku,
          label: attrLabel,
          selectedOptions: v.attributes as Record<string, string>,
          variantId: v.id,
          price: v.price,
          stock: v.stock,
          image: v.images?.[0] || product.thumbnail || product.images?.[0] || null,
        }
      })
    }

    if (configurableAttributes.length === 1) {
      const ca = configurableAttributes[0]
      return ca.options.map((opt) => ({
        id: `${ca.slug}:${opt.value}`,
        sku: `${product.sku}-${opt.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`,
        label: opt.label,
        selectedOptions: { [ca.slug]: opt.value },
        variantId: null,
        price: product.wholesalePrice || currentPrice,
        stock: product.stock,
        isColor: ca.isColor,
        hex: opt.hex,
        image: product.thumbnail || product.images?.[0] || null,
      }))
    }

    if (configurableAttributes.length > 1) {
      const combos: Array<{
        id: string
        sku: string
        label: string
        selectedOptions: Record<string, string>
        variantId: null
        price: number
        stock: number
        image: string | null
      }> = []

      const helper = (attrIndex: number, currentOpts: Record<string, string>, currentLabels: string[]) => {
        if (attrIndex === configurableAttributes.length) {
          const id = Object.entries(currentOpts).map(([k, v]) => `${k}:${v}`).join('|')
          const skuSuffix = Object.values(currentOpts).map((v) => v.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()).join('-')
          combos.push({
            id,
            sku: `${product.sku}-${skuSuffix}`,
            label: currentLabels.join(' / '),
            selectedOptions: { ...currentOpts },
            variantId: null,
            price: product.wholesalePrice || currentPrice,
            stock: product.stock,
            image: product.thumbnail || product.images?.[0] || null,
          })
          return
        }

        const attr = configurableAttributes[attrIndex]
        for (const opt of attr.options) {
          helper(
            attrIndex + 1,
            { ...currentOpts, [attr.slug]: opt.value },
            [...currentLabels, opt.label]
          )
        }
      }

      helper(0, {}, [])
      return combos
    }

    return []
  }, [variants, configurableAttributes, product.wholesalePrice, currentPrice, product.stock, product.sku, product.thumbnail, product.images])

  const totalMatrixUnits = useMemo(
    () => Object.values(matrixQuantities).reduce((sum, q) => sum + (q || 0), 0),
    [matrixQuantities]
  )

  const totalMatrixPrice = totalMatrixUnits * (product.wholesalePrice || currentPrice)

  const handleMatrixAddToQuote = () => {
    const moq = product.minOrderQty || 1
    if (totalMatrixUnits < moq) {
      setMoqError(t('quoteListMoqError', { n: moq }))
      return
    }
    setMoqError('')
    enableWholesaleSession()

    let addedCount = 0
    matrixItems.forEach((item) => {
      const qty = matrixQuantities[item.id] || 0
      if (qty <= 0) return

      const variantLabel = `(${Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')})`
      const displayName = `${product.name} ${variantLabel}`
      const activeImage = item.image || product.thumbnail || product.images?.[0] || null

      addInquiryItem({
        productId: product.id,
        slug: product.slug,
        name: displayName,
        image: activeImage,
        wholesalePrice: item.price,
        retailPrice: currentPrice,
        quantity: qty,
        minOrderQty: moq,
        note: Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join('; '),
      })
      addToQuote({
        productId: product.id,
        productName: displayName,
        productSku: item.sku,
        productImage: activeImage,
        quantity: qty,
        minOrderQty: moq,
        targetPrice: item.price,
        selectedOptions: item.selectedOptions,
        variantId: item.variantId,
      })
      addedCount++
    })

    if (addedCount > 0) {
      setShowQuoteSuccess(true)
      setTimeout(() => setShowQuoteSuccess(false), 3500)
    }
  }

  const saveToGuestCart = (item: {
    productId: string
    product: any
    quantity: number
    variantId?: string | null
    selectedOptions?: Record<string, string> | null
    mode?: 'RETAIL' | 'WHOLESALE'
  }) => {
    try {
      if (typeof window === 'undefined') return
      const raw = localStorage.getItem('yiwu_guest_cart')
      const list = raw ? JSON.parse(raw) : []
      const productObj = item.product?.category && item.product?.department
        ? item.product
        : mapDbProductToDesign3(item.product)

      const existingIdx = list.findIndex(
        (i: any) =>
          (i.product?.id || i.productId) === item.productId &&
          (!item.variantId || i.variantId === item.variantId)
      )
      if (existingIdx > -1) {
        list[existingIdx].quantity = (Number(list[existingIdx].quantity) || 0) + item.quantity
        if (item.selectedOptions) list[existingIdx].selectedOptions = item.selectedOptions
        if (!list[existingIdx].product) list[existingIdx].product = productObj
      } else {
        list.push({
          productId: item.productId,
          product: productObj,
          variantId: item.variantId || null,
          selectedOptions: item.selectedOptions || null,
          quantity: item.quantity,
          mode: item.mode || 'RETAIL',
        })
      }
      localStorage.setItem('yiwu_guest_cart', JSON.stringify(list))
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: list }))
    } catch (e) {
      console.error('[PDP] Failed to save to local guest cart:', e)
    }
  }

  const handleMatrixAddToCart = async () => {
    const moq = product.minOrderQty || 1
    if (totalMatrixUnits < moq) {
      alert(t('quoteListMoqError', { n: moq }) || `Minimum order quantity is ${moq} units`)
      return
    }

    try {
      setAdding(true)
      for (const item of matrixItems) {
        const qty = matrixQuantities[item.id] || 0
        if (qty <= 0) continue

        let added = false
        if (isAuthenticated) {
          try {
            const res = await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                productId: product.id,
                variantId: item.variantId || undefined,
                selectedOptions: item.selectedOptions,
                quantity: qty,
                mode: 'WHOLESALE',
              }),
            })
            if (res.ok) {
              const data = await res.json()
              if (data.success) added = true
            }
          } catch (e) {
            console.warn('[PDP] Matrix add to backend failed, falling back to local', e)
          }
        }

        if (!added) {
          saveToGuestCart({
            productId: product.id,
            product,
            variantId: item.variantId || undefined,
            selectedOptions: item.selectedOptions,
            quantity: qty,
            mode: 'WHOLESALE',
          })
        }
      }
      setShowSuccessMessage(true)
      window.dispatchEvent(new CustomEvent('cart-updated'))
      await refreshCartCount()
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (err) {
      console.error('Error adding matrix to cart:', err)
    } finally {
      setAdding(false)
    }
  }

  const { favoriteIds, toggleWishlist } = useWishlist()
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({})
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [relatedPage, setRelatedPage] = useState(1)
  const [hasMoreRelated, setHasMoreRelated] = useState(true)
  const [loadingMoreRelated, setLoadingMoreRelated] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [quantityInput, setQuantityInput] = useState<string>('1')

  useEffect(() => {
    setQuantityInput(String(quantity))
  }, [quantity])

  useEffect(() => {
    if (!isWholesaleActive && currentStock <= 0) {
      setQuantity(0)
      return
    }
    const minQty = isWholesaleActive ? (product.minOrderQty || 1) : 1
    const maxQty = isWholesaleActive ? 999999 : (currentStock > 0 ? currentStock : 99)
    setQuantity((prev) => {
      if (prev <= 0) return minQty
      if (prev < minQty) return minQty
      if (prev > maxQty) return maxQty
      return prev
    })
  }, [isWholesaleActive, product.minOrderQty, currentStock])
  const [adding, setAdding] = useState(false)
  const [isSpecificationsExpanded, setIsSpecificationsExpanded] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showQuoteSuccess, setShowQuoteSuccess] = useState(false)
  const [moqError, setMoqError] = useState('')
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const companyName = settings?.companyName || 'Global Trade'
  const { isStandalone } = useMobile()
  const [bundleAdded, setBundleAdded] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 44, seconds: 19 })
  const [showStickyBuyBar, setShowStickyBuyBar] = useState(false)
  const [copiedItemNo, setCopiedItemNo] = useState(false)

  useEffect(() => {
    const target = document.getElementById('pdp-main-buy-box')
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isBelow = entry.boundingClientRect.top < 0
        setShowStickyBuyBar(!entry.isIntersecting && isBelow)
      },
      { threshold: 0.1 }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  // Delivery destination from IP/User selection
  const { deliveryAddress } = useDeliveryLocation()

  // Calculate dynamic delivery estimate based on user address and settings
  const deliveryTimingEstimate = useMemo(() => {
    const addr = (deliveryAddress || '').toLowerCase()
    const isBelarus = addr.includes('belarus') || addr.includes('беларусь') || addr.includes('рб') || addr.includes('minsk') || addr.includes('минск') || addr.includes('brest') || addr.includes('брест') || addr.includes('grodno') || addr.includes('гродно') || addr.includes('gomel') || addr.includes('гомель') || addr.includes('vitebsk') || addr.includes('витебск') || addr.includes('mogilev') || addr.includes('могилев')
    const isMinsk = addr.includes('minsk') || addr.includes('минск')
    const isChina = addr.includes('china') || addr.includes('китай') || addr.includes('中国') || addr.includes('yiwu') || addr.includes('иу') || addr.includes('义乌') || addr.includes('zhejiang') || addr.includes('浙江') || addr.includes('shanghai') || addr.includes('上海')

    if (isBelarus) {
      if (isMinsk) {
        return settings?.pdpDeliveryMinsk || (locale === 'ru' ? 'Завтра (1 рабочий день)' : locale === 'zh' ? '次日达（明斯克专线1个工作日）' : 'Tomorrow (1 business day)')
      }
      return settings?.pdpDeliveryBelarusRegion || (locale === 'ru' ? '1 – 3 рабочих дня' : locale === 'zh' ? '白俄罗斯各州（1 – 3个工作日）' : '1 – 3 business days')
    }

    if (isChina) {
      const isHub = addr.includes('yiwu') || addr.includes('иу') || addr.includes('义乌') || addr.includes('zhejiang') || addr.includes('浙江')
      if (isHub) {
        return settings?.pdpDeliveryChinaLocal || (locale === 'ru' ? '24 – 48 часов' : locale === 'zh' ? '中国核心仓现货（24 – 48小时）' : '24 – 48 hours')
      }
      return settings?.pdpDeliveryChinaNationwide || (locale === 'ru' ? '2 – 3 дня' : locale === 'zh' ? '中国全国陆运（2 – 3天）' : '2 – 3 days')
    }

    // Default cross-border delivery estimate or fallback
    return settings?.pdpDeliveryMinsk || (locale === 'ru' ? 'Завтра' : locale === 'zh' ? '次日达' : 'Tomorrow')
  }, [deliveryAddress, settings?.pdpDeliveryMinsk, settings?.pdpDeliveryBelarusRegion, settings?.pdpDeliveryChinaLocal, settings?.pdpDeliveryChinaNationwide, locale])

  useEffect(() => {
    const cutoffHour = parseInt(settings?.pdpCutoffHour || '18', 10) || 18

    const calculateTimeLeft = () => {
      const now = new Date()
      const target = new Date()
      target.setHours(cutoffHour, 0, 0, 0)
      if (now > target) {
        target.setDate(target.getDate() + 1)
      }
      const diff = Math.max(0, target.getTime() - now.getTime())
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)
      const seconds = Math.floor((diff / 1000) % 60)
      return { hours, minutes, seconds }
    }
    setTimeLeft(calculateTimeLeft())
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    return () => clearInterval(interval)
  }, [settings?.pdpCutoffHour])

  const [activeTab, setActiveTab] = useState<
    'overview' | 'product-details' | 'measurements' | 'specs' | 'logistics' | 'faq' | 'reviews'
  >('overview')
  const [isDescExpanded, setIsDescExpanded] = useState(false)

  const ikeaData = useMemo(() => {
    return product.rawIkeaPayload || null
  }, [product.rawIkeaPayload])

  const overviewSummary = useMemo(() => {
    // 1. Prioritize admin's entered description (from translations or product.description)
    if (typeof localized.description === 'string' && localized.description.trim()) {
      return cleanLocalizedDescription(localized.description, locale)
    }
    if (typeof product.description === 'string' && product.description.trim()) {
      return cleanLocalizedDescription(product.description, locale)
    }

    const localizedIkeaSummary =
      ikeaData?.translations?.[locale]?.overview?.summary ||
      ikeaData?.overview?.translations?.[locale]?.summary
    if (localizedIkeaSummary) return cleanLocalizedDescription(localizedIkeaSummary, locale)

    if (ikeaData?.overview?.summary) return cleanLocalizedDescription(ikeaData.overview.summary, locale)
    return t('noDescription')
  }, [ikeaData, localized.description, product.description, locale, t])

  const productHeaderDescription = useMemo(() => {
    if (typeof localized.description === 'string' && localized.description.trim()) {
      return cleanLocalizedDescription(localized.description, locale)
    }
    if (typeof product.description === 'string' && product.description.trim()) {
      return cleanLocalizedDescription(product.description, locale)
    }
    const localizedIkeaSummary =
      ikeaData?.translations?.[locale]?.overview?.summary ||
      ikeaData?.overview?.translations?.[locale]?.summary
    if (localizedIkeaSummary) return cleanLocalizedDescription(localizedIkeaSummary, locale)
    if (ikeaData?.overview?.summary) return cleanLocalizedDescription(ikeaData.overview.summary, locale)
    return null
  }, [localized.description, product.description, ikeaData, locale])

  const overviewFeatures: string[] = useMemo(() => {
    const locFeats =
      ikeaData?.translations?.[locale]?.overview?.features ||
      ikeaData?.overview?.translations?.[locale]?.features
    if (Array.isArray(locFeats) && locFeats.length > 0) {
      return locFeats
    }
    return ikeaData?.overview?.features || []
  }, [ikeaData, locale])

  const keyFeatures: string[] = useMemo(() => {
    const locKf =
      ikeaData?.translations?.[locale]?.productDetails?.keyFeatures ||
      ikeaData?.productDetails?.translations?.[locale]?.keyFeatures
    if (Array.isArray(locKf) && locKf.length > 0) {
      return locKf
    }
    return ikeaData?.productDetails?.keyFeatures || []
  }, [ikeaData, locale])

  const goodToKnow = useMemo(() => {
    return ikeaData?.productDetails?.goodToKnow || product.attributes?.good_to_know || null
  }, [ikeaData, product.attributes])

  const materials = useMemo(() => {
    const locMat =
      ikeaData?.translations?.[locale]?.productDetails?.materials ||
      ikeaData?.productDetails?.translations?.[locale]?.materials
    if (typeof locMat === 'string' && locMat.trim()) return locMat.trim()
    if (typeof ikeaData?.productDetails?.materials === 'string') {
      return ikeaData.productDetails.materials.trim() || null
    }
    return product.material?.trim() || null
  }, [ikeaData, locale, product.material])

  const careInstructions = useMemo(() => {
    const locCare =
      ikeaData?.translations?.[locale]?.productDetails?.careInstructions ||
      ikeaData?.productDetails?.translations?.[locale]?.careInstructions
    if (typeof locCare === 'string' && locCare.trim()) return locCare.trim()
    if (typeof ikeaData?.productDetails?.careInstructions === 'string') {
      return ikeaData.productDetails.careInstructions.trim() || null
    }
    return product.attributes?.care_instructions || product.attributes?.care || null
  }, [ikeaData, locale, product.attributes])

  const designer = useMemo(() => {
    return ikeaData?.productDetails?.designer || product.attributes?.designer || null
  }, [ikeaData, product.attributes])

  const compliance = useMemo(() => {
    return ikeaData?.productDetails?.compliance || null
  }, [ikeaData])

  const dimensionsMap: Record<string, string> = useMemo(() => {
    const locDims =
      ikeaData?.translations?.[locale]?.measurementsTab?.dimensions ||
      ikeaData?.measurementsTab?.translations?.[locale]?.dimensions
    if (locDims && Object.keys(locDims).length > 0) {
      return locDims
    }
    return ikeaData?.measurementsTab?.dimensions || {}
  }, [ikeaData, locale])

  const packagingList: Array<{
    name?: string
    articleNumber?: string
    width?: string
    height?: string
    length?: string
    weight?: string
  }> = useMemo(() => {
    return ikeaData?.measurementsTab?.packaging || []
  }, [ikeaData])

  const whatsIncluded = useMemo(() => {
    const locWi =
      ikeaData?.translations?.[locale]?.productDetails?.whatsIncluded ||
      ikeaData?.productDetails?.translations?.[locale]?.whatsIncluded
    if (typeof locWi === 'string' && locWi.trim()) return locWi.trim()
    if (typeof ikeaData?.productDetails?.whatsIncluded === 'string') {
      return ikeaData.productDetails.whatsIncluded.trim() || null
    }
    return product.attributes?.whats_included || null
  }, [ikeaData, locale, product.attributes])

  const displayNames = useMemo(() => {
    const parsed = getProductDisplayNames({
      name: localized.name || product.name,
      swedenName: ikeaData?.translations?.[locale]?.swedenName || ikeaData?.translations?.[locale]?.productDetails?.swedenName || ikeaData?.swedenName || (product as any)?.swedenName,
      rawIkeaPayload: ikeaData,
      attributes: (product as any)?.attributes,
    })
    return parsed
  }, [ikeaData, locale, localized.name, product.name, (product as any)?.swedenName, (product as any)?.attributes])

  const displaySwedenName = displayNames.swedenName
  const displayEnglishName = displayNames.englishName

  const displayLocalizedName = useMemo(() => {
    // For non-English locales (e.g. ru, zh), prioritize localized product name
    if (locale !== 'en') {
      let name = (localized.name || product.name || '').trim()
      if (displaySwedenName && name) {
        // Strip trailing or leading Swedish name from line 2 if already rendered in line 1
        const escSw = displaySwedenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const endRegex = new RegExp(`\\s*[-–—:]\\s*${escSw}$`, 'i')
        const startRegex = new RegExp(`^${escSw}\\s*[-–—:]\\s*`, 'i')
        const stripped = name.replace(endRegex, '').replace(startRegex, '').trim()
        if (stripped) name = stripped
      }
      return name || localized.name || product.name
    }

    // For English locale:
    if (displayEnglishName && displayEnglishName.toLowerCase() !== displaySwedenName?.toLowerCase()) {
      return displayEnglishName
    }
    return localized.name || product.name
  }, [locale, localized.name, product.name, displaySwedenName, displayEnglishName])

  const displayArticleNumber = useMemo(() => {
    return (selectedVariant as any)?.dromkokItemNo || product.dromkokItemNo || (product as any)?.dromkokItemNumber || null
  }, [(selectedVariant as any)?.dromkokItemNo, product.dromkokItemNo, (product as any)?.dromkokItemNumber])

  const displayProductDetailsDescription = useMemo(() => {
    if (typeof localized.description === 'string' && localized.description.trim()) {
      return cleanLocalizedDescription(localized.description, locale)
    }
    if (typeof product.description === 'string' && product.description.trim()) {
      return cleanLocalizedDescription(product.description, locale)
    }

    const locDesc =
      ikeaData?.translations?.[locale]?.productDetails?.description ||
      ikeaData?.productDetails?.translations?.[locale]?.description
    if (locDesc) return cleanLocalizedDescription(locDesc, locale)

    if (ikeaData?.productDetails?.description) return cleanLocalizedDescription(ikeaData.productDetails.description, locale)
    return overviewSummary || null
  }, [ikeaData, locale, overviewSummary, localized.description, product.description])

  const resolvedDimensions = useMemo(() => {
    const isShippingKey = (key: string) => {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
      return (
        normalized === 'unit' ||
        normalized === 'packageqty' ||
        normalized === 'volumel' ||
        normalized === 'grossweightkg' ||
        normalized === 'netweightkg' ||
        normalized === 'grossweight' ||
        normalized === 'packagecount'
      )
    }

    if (dimensionsMap && Object.keys(dimensionsMap).length > 0) {
      const filtered: Record<string, string> = {}
      Object.entries(dimensionsMap).forEach(([k, v]) => {
        if (!isShippingKey(k) && v && String(v).trim()) {
          filtered[k] = String(v)
        }
      })
      if (Object.keys(filtered).length > 0) {
        return filtered
      }
    }

    // If packagingList already provides package specifications, do not duplicate package dimensions into Section A
    if (packagingList && packagingList.length > 0) {
      const attrFallback: Record<string, string> = {}
      const itemKeys = ['diameter', 'thread_count', 'cord_length', 'seat_height', 'seat_depth', 'seat_width']
      itemKeys.forEach((key) => {
        if (product.attributes?.[key]) {
          const title = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          attrFallback[title] = String(product.attributes[key])
        }
      })
      return attrFallback
    }

    const fallback: Record<string, string> = {}
    if (product.dimensions) {
      if (typeof product.dimensions === 'object') {
        const dimObj = product.dimensions as Record<string, any>
        const hasOnlyShipping = Object.keys(dimObj).every((k) =>
          isShippingKey(k) || ['width', 'height', 'length'].includes(k.toLowerCase())
        )
        if (!hasOnlyShipping) {
          Object.entries(dimObj).forEach(([k, v]) => {
            if (!isShippingKey(k) && v) {
              const unitStr = dimObj.unit ? ` ${dimObj.unit}` : (typeof v === 'number' ? ' cm' : '')
              const valStr = typeof v === 'number' && !String(v).includes('cm') ? `${v}${unitStr}` : String(v)
              fallback[k.charAt(0).toUpperCase() + k.slice(1)] = valStr
            }
          })
        }
      } else if (typeof product.dimensions === 'string' && product.dimensions.trim()) {
        fallback['Dimensions'] = product.dimensions
      }
    }
    const standardKeys = ['diameter', 'thread_count', 'cord_length', 'seat_height', 'seat_depth', 'seat_width']
    standardKeys.forEach((key) => {
      if (product.attributes?.[key]) {
        const title = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        fallback[title] = String(product.attributes[key])
      }
    })
    return fallback
  }, [dimensionsMap, packagingList, product.dimensions, product.attributes])

  // Category Attributes with filled values (from /admin/attributes)
  const categoryAttributesWithValues = useMemo(() => {
    const list: Array<{
      key: string
      name: string
      value: any
      displayValue: string
    }> = []

    const catAttrs = product.categoryAttributes || []
    const prodAttrs = product.attributes || {}

    catAttrs.forEach((ca: any) => {
      if (ca.isVisible === false || ca.isActive === false) return
      let rawVal = prodAttrs[ca.slug]
      if (rawVal === undefined && ca.slug === 'material' && product.material) {
        rawVal = product.material
      }

      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
        if (Array.isArray(rawVal) && rawVal.length === 0) return

        const displayValue = resolveLocalizedAttributeValue(ca, rawVal, locale)

        if (displayValue && displayValue.trim()) {
          list.push({
            key: ca.slug,
            name: ca.name || ca.slug,
            value: rawVal,
            displayValue: displayValue.trim(),
          })
        }
      }
    })

    return list
  }, [product.categoryAttributes, product.attributes, product.material, locale])

  // 1. Clean Lead Description (authentic storytelling from IKEA / catalog)
  const ikeaLeadDescription = useMemo(() => {
    if (typeof ikeaData?.description === 'string' && ikeaData.description.trim()) {
      const raw = ikeaData.description.trim()
      const firstSection = raw.split(/\n\s*\n|\bKey features:|\bGood to know:/i)[0]?.trim()
      if (firstSection && firstSection.length > 20 && !/^good to know/i.test(firstSection)) {
        return firstSection
      }
    }
    return null
  }, [ikeaData?.description])

  const effectiveOverviewText = useMemo(() => {
    if (typeof localized.description === 'string' && localized.description.trim()) {
      return cleanLocalizedDescription(localized.description, locale)
    }
    if (ikeaLeadDescription) {
      return cleanLocalizedDescription(ikeaLeadDescription, locale)
    }
    if (typeof product.description === 'string' && product.description.trim()) {
      return cleanLocalizedDescription(product.description, locale)
    }
    return overviewSummary || t('noDescription')
  }, [localized.description, ikeaLeadDescription, product.description, overviewSummary, locale, t])

  // 2. Intelligent Product Details Parser (cleans concatenated strings, parses Good to know, Materials, Care)
  const parsedProductDetails = useMemo(() => {
    const rawKf = keyFeatures || []
    const rawGtk = goodToKnow || ''

    let extractedGoodToKnowList: string[] = []
    let extractedMaterials = materials || ''
    let extractedCare = careInstructions || ''
    let extractedCompliance = compliance || ''
    let extractedAssemblyDocs: string[] = []
    let cleanedKeyFeatures: string[] = []

    const cleanSectionPrefix = (text: string, prefix: string) => {
      const regex = new RegExp(`^${prefix}\\s*`, 'i')
      return text.replace(regex, '').trim()
    }

    rawKf.forEach((item) => {
      const trimmed = item.trim()
      if (/^good to know/i.test(trimmed)) {
        const body = cleanSectionPrefix(trimmed, 'good to know')
        const sentences = body
          .split(/(?<=[.!?])\s+(?=[A-Z])/)
          .map((s) => s.trim())
          .filter((s) => s.length > 10 && !/^good to know/i.test(s))
        extractedGoodToKnowList.push(...sentences)
      } else if (/^materials and care/i.test(trimmed) || /^material/i.test(trimmed)) {
        const body = cleanSectionPrefix(trimmed, 'materials and care')
        if (/care/i.test(body)) {
          const [matPart, carePart] = body.split(/care/i)
          if (!extractedMaterials && matPart) {
            extractedMaterials = cleanSectionPrefix(matPart, 'material')
              .replace(/battery box:/i, 'Battery box: ')
              .replace(/protective pad:/i, ' • Protective pad: ')
              .trim()
          }
          if (!extractedCare && carePart) {
            extractedCare = carePart.trim()
          }
        } else if (!extractedMaterials) {
          extractedMaterials = cleanSectionPrefix(body, 'material').trim()
        }
      } else if (/^safety and compliance/i.test(trimmed)) {
        if (!extractedCompliance) {
          extractedCompliance = cleanSectionPrefix(trimmed, 'safety and compliance').trim()
        }
      } else if (/^assembly and documents/i.test(trimmed) || /^assembly instructions/i.test(trimmed)) {
        extractedAssemblyDocs.push(cleanSectionPrefix(trimmed, 'assembly and documents'))
      } else {
        cleanedKeyFeatures.push(trimmed)
      }
    })

    if (extractedGoodToKnowList.length === 0 && rawGtk) {
      const cleaned = cleanSectionPrefix(rawGtk, 'good to know')
      const sentences = cleaned
        .split(/(?<=[.!?])\s+(?=[A-Z])/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10 && !/^good to know/i.test(s))
      extractedGoodToKnowList = Array.from(new Set(sentences))
    }

    extractedGoodToKnowList = Array.from(new Set(extractedGoodToKnowList))

    return {
      goodToKnowList: extractedGoodToKnowList,
      materials: extractedMaterials,
      care: extractedCare,
      compliance: extractedCompliance,
      assemblyDocs: extractedAssemblyDocs,
      keyFeatures: cleanedKeyFeatures,
    }
  }, [keyFeatures, goodToKnow, materials, careInstructions, compliance])

  // 3. Overview Highlights — only show if admin explicitly saved them in the form
  const overviewHighlightCards = useMemo(() => {
    if (!overviewFeatures || overviewFeatures.length === 0) return []
    return overviewFeatures.map((feat) => ({
      icon: <Sparkles className="w-4 h-4 text-[#00407a]" />,
      title: feat.split(/[:.]/)[0]?.trim() || feat,
      description: feat,
    }))
  }, [overviewFeatures])

  // 4. Dimension Cards for Measurements Tab — only real data from DB
  const dimensionCards = useMemo(() => {
    const DIMENSION_LABEL_MAP: Record<string, { ru: string; zh: string }> = {
      depth: { ru: 'Глубина', zh: '进深' },
      width: { ru: 'Ширина', zh: '宽度' },
      height: { ru: 'Высота', zh: '高度' },
      length: { ru: 'Длина', zh: '长度' },
      diameter: { ru: 'Диаметр', zh: '直径' },
      'seat depth': { ru: 'Глубина сиденья', zh: '座深' },
      'seat width': { ru: 'Ширина сиденья', zh: '座宽' },
      'seat height': { ru: 'Высота сиденья', zh: '座高' },
      'cord length': { ru: 'Длина шнура', zh: '电线长度' },
      'thread count': { ru: 'Плотность нитей', zh: '支数' },
      dimensions: { ru: 'Размеры', zh: '尺寸' },
      weight: { ru: 'Вес', zh: '重量' },
      thickness: { ru: 'Толщина', zh: '厚度' },
      volume: { ru: 'Объем', zh: '体积' },
    }

    const localizeLabel = (rawKey: string): string => {
      const normalized = rawKey.trim().toLowerCase()
      if (DIMENSION_LABEL_MAP[normalized]) {
        if (locale === 'ru') return DIMENSION_LABEL_MAP[normalized].ru
        if (locale === 'zh') return DIMENSION_LABEL_MAP[normalized].zh
      }
      return rawKey
    }

    const localizeValue = (rawVal: string): string => {
      if (!rawVal) return ''
      if (locale === 'ru') {
        return rawVal
          .replace(/\bcm\b/gi, 'см')
          .replace(/\bmm\b/gi, 'мм')
          .replace(/\bm\b/gi, 'м')
          .replace(/\bkg\b/gi, 'кг')
          .replace(/\bg\b/gi, 'г')
      }
      if (locale === 'zh') {
        return rawVal
          .replace(/\bcm\b/gi, '厘米')
          .replace(/\bmm\b/gi, '毫米')
          .replace(/\bm\b/gi, '米')
          .replace(/\bkg\b/gi, '千克')
          .replace(/\bg\b/gi, '克')
      }
      return rawVal
    }

    const cards: Array<{ label: string; value: string }> = []

    Object.entries(resolvedDimensions).forEach(([k, v]) => {
      cards.push({
        label: localizeLabel(k),
        value: localizeValue(String(v)),
      })
    })

    if (cards.length === 0 && product.dimensions && typeof product.dimensions === 'object') {
      const d = product.dimensions as Record<string, any>
      const cmUnit = locale === 'ru' ? 'см' : locale === 'zh' ? '厘米' : 'cm'
      if (d.width) cards.push({ label: locale === 'ru' ? 'Ширина' : locale === 'zh' ? '宽度' : 'Width', value: `${d.width} ${cmUnit}` })
      if (d.depth) cards.push({ label: locale === 'ru' ? 'Глубина' : locale === 'zh' ? '进深' : 'Depth', value: `${d.depth} ${cmUnit}` })
      if (d.height) cards.push({ label: locale === 'ru' ? 'Высота' : locale === 'zh' ? '高度' : 'Height', value: `${d.height} ${cmUnit}` })
    }

    return cards
  }, [resolvedDimensions, product.dimensions, locale])

  const dimensionsSummaryPill = useMemo(() => {
    if (dimensionCards.length > 0) {
      return dimensionCards.map((c) => c.value).join(' × ')
    }
    return null
  }, [dimensionCards])

  const hasCategoryAttributesData = categoryAttributesWithValues.length > 0

  const visibleTabs = useMemo(() => {
    const tabs: Array<{ id: string; label: string; count: number | null }> = [
      { id: 'overview', label: locale === 'ru' ? 'Обзор' : locale === 'zh' ? '概览' : 'Overview', count: null },
      { id: 'product-details', label: locale === 'ru' ? 'Информация о товаре' : locale === 'zh' ? '商品详情' : 'Product details', count: null },
      { id: 'measurements', label: locale === 'ru' ? 'Размеры' : locale === 'zh' ? '尺寸规格' : 'Measurements', count: null },
    ]

    if (hasCategoryAttributesData) {
      tabs.push({
        id: 'specs',
        label: t('specifications') || (locale === 'ru' ? 'Характеристики' : locale === 'zh' ? '规格参数' : 'Specifications'),
        count: null,
      })
    }

    tabs.push({
      id: 'reviews',
      label: locale === 'ru' ? 'Отзывы' : locale === 'zh' ? '评价' : 'Reviews',
      count: reviewsCount,
    })

    return tabs
  }, [locale, hasCategoryAttributesData, t, reviewsCount])

  useEffect(() => {
    if (activeTab === 'specs' && !hasCategoryAttributesData) {
      setActiveTab('overview')
    }
  }, [activeTab, hasCategoryAttributesData])

  const handleRelatedAddToCart = async (target: any, qty = 1, mode?: 'RETAIL' | 'WHOLESALE') => {
    const isInstant = settings?.rfqModel === 'INSTANT'
    const targetMode = mode || (isWholesaleCustomer && isInstant ? 'WHOLESALE' : isWholesaleCustomer ? 'WHOLESALE' : 'RETAIL')
    const moq = target.moq || (target as any).minOrderQty || 1

    if (targetMode === 'WHOLESALE' && !isInstant) {
      enableWholesaleSession()
      addInquiryItem({
        productId: target.id,
        slug: target.slug || target.id,
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
        productSku: target.sku || target.slug || target.id,
        productImage: target.image,
        quantity: moq,
        minOrderQty: moq,
      })
      setCartQuantities((prev) => ({ ...prev, [target.id]: (prev[target.id] || 0) + moq }))
      return
    }

    try {
      const orderQty = targetMode === 'WHOLESALE' ? Math.max(qty, moq) : qty
      let added = false

      if (isAuthenticated) {
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              productId: target.id,
              quantity: orderQty,
              mode: targetMode,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              added = true
            }
          }
        } catch (err) {
          console.warn('[PDP] Failed adding related product to backend cart:', err)
        }
      }

      if (!added) {
        saveToGuestCart({
          productId: target.id,
          product: target,
          quantity: orderQty,
          mode: targetMode,
        })
        added = true
      }

      if (added) {
        window.dispatchEvent(new CustomEvent('cart-updated'))
        await refreshCartCount()
        setCartQuantities((prev) => ({ ...prev, [target.id]: (prev[target.id] || 0) + 1 }))
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert(tCart('errors.failedAdd'))
    }
  }

  const handleRelatedUpdateQuantity = (productId: string, qty: number) => {
    setCartQuantities((prev) => ({ ...prev, [productId]: Math.max(0, qty) }))
  }

  // Initialize using the store-mode-effective MOQ (product already fetched
  // server-side — no loading skeleton needed on first paint).
  useEffect(() => {
    const effectiveMinQty = getEffectiveMinOrderQty(product.minOrderQty || 1, storeMode)
    setQuantity(effectiveMinQty)
  }, [product.minOrderQty, storeMode])

  useEffect(() => {
    if (slug) {
      setRelatedPage(1)
      setHasMoreRelated(true)
      fetchRelatedProducts()
    }
  }, [slug])

  const fetchRelatedProducts = async () => {
    try {
      const response = await fetch(`/api/products/${slug}/related?limit=8&page=1&locale=${encodeURIComponent(locale)}`)
      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        setRelatedProducts(data.data)
        setHasMoreRelated(Boolean(data.pagination?.hasMore ?? (data.data.length > 0)))
      }
    } catch (error) {
      console.error('Error fetching related products:', error)
    }
  }

  const loadMoreRelatedProducts = async () => {
    if (loadingMoreRelated || !hasMoreRelated) return
    setLoadingMoreRelated(true)
    try {
      const nextPage = relatedPage + 1
      const response = await fetch(`/api/products/${slug}/related?limit=8&page=${nextPage}&locale=${encodeURIComponent(locale)}`)
      const data = await response.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setRelatedProducts((prev) => [...prev, ...data.data])
        setRelatedPage(nextPage)
        setHasMoreRelated(Boolean(data.pagination?.hasMore ?? true))
      } else {
        setHasMoreRelated(false)
      }
    } catch (error) {
      console.error('Error fetching more related products:', error)
      setHasMoreRelated(false)
    } finally {
      setLoadingMoreRelated(false)
    }
  }

  const handleQuantityChange = (delta: number) => {
    const minQty = isWholesaleActive ? (product.minOrderQty || 1) : 1
    const maxQty = isWholesaleActive ? 999999 : (currentStock > 0 ? currentStock : 99)

    let nextVal = quantity + delta
    if (quantity < minQty && delta > 0) {
      nextVal = minQty
    } else if (quantity > maxQty && delta < 0) {
      nextVal = maxQty
    }

    nextVal = Math.max(minQty, Math.min(maxQty, nextVal))
    setQuantity(nextVal)

    if (moqError && nextVal >= minQty) setMoqError('')
    if (isBoth && product.wholesalePrice && nextVal >= (product.minOrderQty || 1)) {
      enableWholesaleSession()
    }
  }

  const handleAddToCart = async () => {
    // Validate that all configurable attributes are selected
    if (configurableAttributes.length > 0) {
      const missing = configurableAttributes.find((ca) => !selectedOptions[ca.slug])
      if (missing) {
        alert(`${locale === 'ru' ? 'Пожалуйста, выберите' : locale === 'zh' ? '请选择' : 'Please select'} ${missing.name}`)
        return
      }
    }

    try {
      setAdding(true)
      let addedSuccessfully = false

      if (isAuthenticated) {
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              productId: product.id,
              variantId: selectedVariant?.id,
              selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
              quantity,
              mode: isWholesaleActive ? 'WHOLESALE' : 'RETAIL',
            })
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              addedSuccessfully = true
            }
          }
        } catch (backendErr) {
          console.warn('[PDP] Backend cart rejected item, falling back to local guest cart', backendErr)
        }
      }

      if (!addedSuccessfully) {
        saveToGuestCart({
          productId: product.id,
          product,
          variantId: selectedVariant?.id,
          selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
          quantity,
          mode: isWholesaleActive ? 'WHOLESALE' : 'RETAIL',
        })
        addedSuccessfully = true
      }

      if (addedSuccessfully) {
        setShowSuccessMessage(true)
        window.dispatchEvent(new CustomEvent('cart-updated'))
        await refreshCartCount()
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccessMessage(false), 3000)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert(tCart('errors.failedAdd'))
    } finally {
      setAdding(false)
    }
  }

  const handleQuickOrder = async () => {
    await handleAddToCart()
    if (!isAuthenticated) {
      router.push(`/${locale}/register?redirect=/${locale}/checkout`)
    } else {
      navigate('/checkout')
    }
  }

  const handleAddBundleToCart = async (bundleItem: any) => {
    try {
      setAdding(true)
      let primaryAdded = false

      if (isAuthenticated) {
        try {
          const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              productId: product.id,
              variantId: selectedVariant?.id,
              selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
              quantity: 1,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            if (data.success) primaryAdded = true
          }
        } catch {}
      }

      if (!primaryAdded) {
        saveToGuestCart({
          productId: product.id,
          product,
          variantId: selectedVariant?.id,
          selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
          quantity: 1,
        })
      }

      // 2. Add bundle accessory/item if real product ID
      if (bundleItem?.id && bundleItem.id !== 'accessory-fallback') {
        let accessoryAdded = false
        if (isAuthenticated) {
          try {
            const res = await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                productId: bundleItem.id,
                quantity: 1,
              }),
            })
            if (res.ok) {
              const data = await res.json()
              if (data.success) accessoryAdded = true
            }
          } catch {}
        }

        if (!accessoryAdded) {
          saveToGuestCart({
            productId: bundleItem.id,
            product: bundleItem,
            quantity: 1,
          })
        }
      }

      window.dispatchEvent(new CustomEvent('cart-updated'))
      await refreshCartCount()
      setBundleAdded(true)
      setShowSuccessMessage(true)
      setTimeout(() => {
        setBundleAdded(false)
        setShowSuccessMessage(false)
      }, 3500)
    } catch (err) {
      console.error('Error adding bundle to cart:', err)
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

    const hasOptions = Object.keys(selectedOptions).length > 0
    const variantLabel = hasOptions
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
      note: hasOptions
        ? Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join('; ')
        : selectedVariant
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
      selectedOptions: hasOptions ? selectedOptions : undefined,
      variantId: selectedVariant?.id || null,
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

  const discount =
    showOriginalPrice && showOriginalPrice > displayPrice
      ? Math.round(((showOriginalPrice - displayPrice) / showOriginalPrice) * 100)
      : 0
  const catalogDiscount =
    currentCompareAtPrice && currentCompareAtPrice > currentPrice
      ? Math.round(((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100)
      : discount

  const breadcrumbs = [
    { name: tProducts('products'), href: '/store' },
  ]

  if (product.category) {
    breadcrumbs.push({
      name: localizedCategoryName,
      href: `/store?category=${product.category.slug}`
    })
  }

  breadcrumbs.push({
    name: localized.name,
    href: `/products/${product.slug}`
  })

  // Frequently Bought Together Bundle Card
  const bundleItem = relatedProducts.length > 0 ? relatedProducts[0] : {
    id: 'accessory-fallback',
    name: locale === 'ru' ? 'Набор силиконовых форм для выпечки (24 шт.)' : locale === 'zh' ? '24件装耐高温硅胶烘焙模具' : '24-Piece Silicone Reusable Baking Cups',
    price: 9.99,
    image: currentImages[1] || currentImages[0],
  }
  const bundleTotalPrice = currentPrice + bundleItem.price
  const bundleDiscountPrice = bundleTotalPrice * 0.9
  const bundleSavings = bundleTotalPrice - bundleDiscountPrice

  const bundleSection = (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-xs text-slate-900 tracking-tight flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{locale === 'ru' ? 'Часто покупают вместе' : locale === 'zh' ? '经常一起购买组合' : 'Frequently Bought Together'}</span>
        </h3>
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {locale === 'ru' ? 'Скидка 10%' : locale === 'zh' ? '省10%' : 'Save 10%'}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Item 1 */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex-1 min-w-0">
          <div className="relative w-11 h-11 bg-white rounded-lg p-0.5 border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
            <ProductImage
              src={currentImages[0]}
              alt={localized.name}
              fill
              sizes="44px"
              className="object-contain p-0.5"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate">{localized.name}</p>
            <p className="text-xs font-black text-slate-900">{formatPrice(currentPrice)}</p>
          </div>
        </div>

        <span className="text-slate-400 font-black text-sm shrink-0">+</span>

        {/* Item 2 */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex-1 min-w-0">
          <div className="relative w-11 h-11 bg-white rounded-lg p-0.5 border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
            <ProductImage
              src={(bundleItem as any).image || currentImages[1] || currentImages[0]}
              alt={bundleItem.name}
              fill
              sizes="44px"
              className="object-contain p-0.5"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate">{bundleItem.name}</p>
            <p className="text-xs font-black text-slate-900">{formatPrice(bundleItem.price)}</p>
          </div>
        </div>
      </div>

      {/* Bundle pricing summary & Add Both Button */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-[#00407a]">{formatPrice(bundleDiscountPrice)}</span>
            <span className="text-xs text-slate-400 line-through">{formatPrice(bundleTotalPrice)}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold block">
            {locale === 'ru' ? `Экономия ${formatPrice(bundleSavings)}` : locale === 'zh' ? `立省 ${formatPrice(bundleSavings)}` : `Save ${formatPrice(bundleSavings)}`}
          </span>
        </div>

        {isUserLoggedIn ? (
          <button
            type="button"
            onClick={() => handleAddBundleToCart(bundleItem)}
            disabled={adding}
            className="px-4 py-2 bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{bundleAdded ? (locale === 'ru' ? 'Добавлено!' : locale === 'zh' ? '已加入' : 'Added!') : (locale === 'ru' ? 'Купить оба' : locale === 'zh' ? '购买组合' : 'Add Both')}</span>
          </button>
        ) : (
          <LocaleLink
            href={`/sign-in?redirect=${encodeURIComponent(`/products/${product.slug}`)}`}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-[#00407a]" />
            <span>{locale === 'ru' ? 'Войти для покупки' : locale === 'zh' ? '登录购买' : 'Sign In to Buy'}</span>
          </LocaleLink>
        )}
      </div>
    </div>
  )

  // 3-Benefit Reassurance Strip (Warranty, Express Delivery, 14-Day Returns)
  const isWarrantyEnabled = (settings as any)?.pdpWarrantyBadgeEnabled !== false && (settings as any)?.pdpWarrantyBadgeEnabled !== 'false'
  const isDeliveryEnabled = (settings as any)?.pdpDeliveryBadgeEnabled !== false && (settings as any)?.pdpDeliveryBadgeEnabled !== 'false'
  const isReturnsEnabled = (settings as any)?.pdpReturnsBadgeEnabled !== false && (settings as any)?.pdpReturnsBadgeEnabled !== 'false'
  const activeReassuranceCount = (isWarrantyEnabled ? 1 : 0) + (isDeliveryEnabled ? 1 : 0) + (isReturnsEnabled ? 1 : 0)

  const reassuranceSection = activeReassuranceCount === 0 ? null : (
    <div className={`grid grid-cols-1 ${activeReassuranceCount === 3 ? 'sm:grid-cols-3' : activeReassuranceCount === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-2.5 bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs`}>
      {isWarrantyEnabled && (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0 border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-[#00407a]" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block leading-tight">
              {settings?.pdpWarrantyTitle || (locale === 'ru' ? '2 года гарантии' : locale === 'zh' ? '2年原厂质保' : '2-Year Warranty')}
            </span>
            <span className="text-[11px] text-slate-500">
              {settings?.pdpWarrantySubtitle || (locale === 'ru' ? 'Официальная' : locale === 'zh' ? '官方正品联保' : 'Full factory coverage')}
            </span>
          </div>
        </div>
      )}

      {isDeliveryEnabled && (
        <div className={`flex items-center gap-2.5 ${isWarrantyEnabled ? 'border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3' : ''}`}>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block leading-tight">
              {settings?.pdpDeliveryTitle || (locale === 'ru' ? 'Экспресс-доставка' : locale === 'zh' ? '极速直达物流' : 'Express Delivery')}
            </span>
            <span className="text-[11px] text-slate-500">
              {settings?.pdpDeliverySubtitle || (locale === 'ru' ? 'От $50 бесплатно' : locale === 'zh' ? '满额免费包邮' : 'Free over $50+')}
            </span>
          </div>
        </div>
      )}

      {isReturnsEnabled && (
        <div className={`flex items-center gap-2.5 ${(isWarrantyEnabled || isDeliveryEnabled) ? 'border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3' : ''}`}>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <RefreshCw className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 block leading-tight">
              {settings?.pdpReturnsTitle || (locale === 'ru' ? '14 дней возврат' : locale === 'zh' ? '14天无忧退换' : '14-Day Returns')}
            </span>
            <span className="text-[11px] text-slate-500">
              {settings?.pdpReturnsSubtitle || (locale === 'ru' ? 'Легкий возврат' : locale === 'zh' ? '支持退款换货' : 'Hassle-free guarantee')}
            </span>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* MOBILE PDP VIEW (Phase 3, hidden on md+) */}
      <div className="md:hidden">
        <MobileProductDetailView
          product={mapDbProductToDesign3({
            ...product,
            name: displayLocalizedName,
            swedenName: displaySwedenName || undefined,
            englishName: (locale === 'en' && displayEnglishName && displayEnglishName.toLowerCase() !== displaySwedenName?.toLowerCase()) ? displayEnglishName : undefined,
            description: productHeaderDescription || localized.description || product.description
          })}
          relatedProducts={relatedProducts.map(mapDbProductToDesign3)}
          loadMoreRelated={loadMoreRelatedProducts}
          hasMoreRelated={hasMoreRelated}
          loadingMoreRelated={loadingMoreRelated}
          isLoggedIn={isUserLoggedIn}
          onAddToCart={(_p, q) => {
            setQuantity(q);
            handleAddToCart();
          }}
          onRequestQuote={(_p, q) => {
            setQuantity(q);
            handleAddToQuoteList();
          }}
          onBack={() => router.back()}
          optionKeys={optionKeys}
          optionValuesMap={optionValuesMap}
          configurableAttributes={configurableAttributes}
          selectedOptions={selectedOptions}
          onSelectOption={(k, v) => setSelectedOptions((prev) => ({ ...prev, [k]: v }))}
          variants={variants}
          selectedVariant={selectedVariant}
          displayPrice={displayPrice}
          compareAtPrice={showOriginalPrice}
          stock={currentStock}
          allImages={currentImages}
          isWholesale={isWholesaleActive}
          isInstantWholesale={isInstantWholesale}
        />
      </div>

      {/* DESKTOP PDP VIEW (100% byte-identical, hidden on mobile) */}
      <div className="hidden md:block">
        <SharedLayout
          showHero={true}
          pageTitle={localized.name}
          pageDescription={localized.description?.substring(0, 150) || `High-quality ${localized.name}`}
          breadcrumbs={breadcrumbs}
        >
          <div className="bg-[#F8FAFC] py-3 pb-24 lg:pb-8">
        <Container>
          {/* In-Page Clean Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 flex-wrap">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="hover:text-[#00407a] transition-colors font-medium cursor-pointer"
                >
                  Home
                </button>
              </li>
              {breadcrumbs.map((crumb, idx) => (
                <li key={crumb.href || idx} className="flex items-center gap-1.5 sm:gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="font-bold text-slate-900 line-clamp-1 max-w-[200px] sm:max-w-md">
                      {crumb.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(crumb.href)}
                      className="hover:text-[#00407a] transition-colors font-medium cursor-pointer"
                    >
                      {crumb.name}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Floating Action Notifications */}
          {showSuccessMessage && (
            <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-slide-in">
              <div className="bg-white rounded-full p-0.5">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('addedToCart')}</p>
                <p className="text-xs text-emerald-100">{t('itemsAdded', { n: quantity })}</p>
              </div>
            </div>
          )}

          {showQuoteSuccess && (
            <div className="fixed top-20 right-4 z-50 bg-[#00407a] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-slide-in">
              <div className="bg-white rounded-full p-0.5">
                <Check className="w-4 h-4 text-[#00407a]" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('addedToQuoteList')}</p>
                <p className="text-xs text-blue-100">{t('itemsAdded', { n: quantity })}</p>
                <button
                  type="button"
                  onClick={() => navigate('/wholesale')}
                  className="text-xs font-bold underline underline-offset-2 mt-0.5 hover:text-white cursor-pointer"
                >
                  {t('viewQuoteList')}
                </button>
              </div>
            </div>
          )}

          {/* Standard Balanced 2-Column PDP Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 mb-6 items-start">
            {/* Left Side: Product Gallery, Reassurance, Frequently Bought Together & Specs (lg:col-span-7) */}
            <div className="lg:col-span-7 min-w-0 w-full space-y-4">
              <div className="lg:sticky lg:top-20 space-y-4">
                {/* 1. Main Gallery */}
                <ProductImageGallery
                  images={currentImages}
                  productName={localized.name}
                />

                {/* Desktop-only: Reassurance & Frequently Bought Together Bundle */}
                <div className="hidden lg:block space-y-4">
                  {reassuranceSection}
                  {bundleSection}
                </div>
              </div>
            </div>

            {/* Right Side: The Complete Buying & Decision Hub (lg:col-span-5) */}
            <div className="lg:col-span-5 min-w-0 w-full space-y-4">
              <div className="lg:sticky lg:top-20 space-y-4">
                {/* Main Buy Box Container */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
                  {/* 1. Category, Item # and High Demand / Status Badges */}
                  <div className="flex items-center justify-between gap-2.5 flex-wrap pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#00407a] border border-blue-200/80 font-black text-sm uppercase tracking-wider shadow-2xs">
                        <Layers className="w-4 h-4 text-[#00407a]" />
                        <span>{localizedCategoryName || 'Cookware & Bakeware'}</span>
                      </span>

                      {((selectedVariant as any)?.dromkokItemNo ?? product.dromkokItemNo) && (() => {
                        const itemCode = ((selectedVariant as any)?.dromkokItemNo ?? product.dromkokItemNo)
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(itemCode)
                              setCopiedItemNo(true)
                              setTimeout(() => setCopiedItemNo(false), 2000)
                            }}
                            title={copiedItemNo ? 'Copied to clipboard!' : 'Click to copy item number'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80 text-sm font-sans transition-colors cursor-pointer group"
                          >
                            <span className="text-slate-500 font-bold">
                              {locale === 'ru' ? 'Артикул:' : locale === 'zh' ? '商品编号:' : 'Item #:'}
                            </span>
                            <span className="font-extrabold text-slate-900 group-hover:text-[#00407a] tracking-tight">{itemCode}</span>
                            {copiedItemNo ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />
                            )}
                          </button>
                        )
                      })()}
                    </div>

                    {/* High Demand Badge (Admin on/off controlled) */}
                    {(() => {
                      const isHighDemandEnabled =
                        (settings as any)?.pdpHighDemandBadgeEnabled !== false &&
                        (settings as any)?.pdpHighDemandBadgeEnabled !== 'false'
                      const rawThreshold = (settings as any)?.pdpHighDemandThreshold
                      const threshold = typeof rawThreshold === 'number' ? rawThreshold : (parseInt(rawThreshold || '100', 10) || 100)
                      const highDemandText = (settings as any)?.pdpHighDemandText || t('inHighDemand')

                      if (!isHighDemandEnabled || currentStock <= threshold) return null

                      return (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-2xs">
                          <Flame className="w-3.5 h-3.5 text-amber-600" />
                          {highDemandText}
                        </span>
                      )
                    })()}
                  </div>

                  {/* 2. Product Title & Naming Stack: Scandinavian Typography */}
                  <div className="space-y-1.5 pt-0.5">
                    {/* Line 1: Swedish Name */}
                    {displaySwedenName && (
                      <div className="text-2xl sm:text-3xl font-black text-[#00407a] uppercase tracking-wide leading-tight">
                        {displaySwedenName}
                      </div>
                    )}

                    {/* Line 2: Localized Product Name */}
                    <h1 className={`${displaySwedenName ? 'text-lg sm:text-xl font-bold text-slate-800' : 'text-xl sm:text-2xl font-black text-slate-900'} leading-snug tracking-tight`}>
                      {displayLocalizedName}
                    </h1>
                  </div>

                  {/* 3. Product Overview Summary Card */}
                  {(displayProductDetailsDescription || productHeaderDescription) && (() => {
                    const descText = displayProductDetailsDescription || productHeaderDescription || ''
                    const cleanText = descText.replace(/<[^>]+>/g, '').trim()
                    const isHtml = /<[a-z][\s\S]*>/i.test(descText)
                    const isLong = cleanText.length > 180

                    return (
                      <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-3 sm:p-3.5 text-xs sm:text-[13px] text-slate-600 leading-relaxed shadow-2xs">
                        <div className={`transition-all duration-200 ${!isDescExpanded && isLong ? 'line-clamp-3' : ''}`}>
                          {isHtml ? (
                            <div
                              className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed text-xs sm:text-[13px]"
                              dangerouslySetInnerHTML={{ __html: descText }}
                            />
                          ) : (
                            <p className="whitespace-pre-line leading-relaxed">{descText}</p>
                          )}
                        </div>
                        {isLong && (
                          <button
                            type="button"
                            onClick={() => setIsDescExpanded(!isDescExpanded)}
                            className="mt-2 text-xs font-bold text-[#00407a] hover:text-[#002d57] inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {isDescExpanded ? (
                              <>
                                {locale === 'ru' ? 'Свернуть' : locale === 'zh' ? '收起' : 'Show less'}
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                {locale === 'ru' ? 'Читать полностью' : locale === 'zh' ? '展开全文' : 'Read more'}
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )
                  })()}

                  {/* 4. Rating & Review Summary Line */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              reviewsCount > 0 && star <= Math.round(averageRating)
                                ? 'fill-amber-400 text-amber-400'
                                : reviewsCount > 0
                                ? 'fill-slate-200 text-slate-200'
                                : 'fill-amber-300/30 text-amber-400/60'
                            }`}
                          />
                        ))}
                      </div>
                      {reviewsCount > 0 ? (
                        <>
                          <span className="text-sm font-black text-slate-900">{averageRating.toFixed(1)}</span>
                          <span className="text-slate-300">•</span>
                          <a
                            href="#product-tabs"
                            onClick={() => setActiveTab('reviews')}
                            className="text-xs text-slate-600 hover:text-[#00407a] font-semibold transition-colors underline-offset-2 hover:underline"
                          >
                            {reviewsCount} {reviewsCount === 1 ? 'Review' : t('customerReviews')}
                          </a>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-medium text-slate-500">
                            {t('noReviews') || 'No reviews yet'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <a
                            href="#product-tabs"
                            onClick={() => setActiveTab('reviews')}
                            className="text-xs text-[#00407a] font-bold hover:underline transition-colors cursor-pointer"
                          >
                            {locale === 'ru' ? 'Оставить отзыв' : locale === 'zh' ? '发表首条评价' : 'Be first to review'}
                          </a>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <WishlistButton
                        productId={product.id}
                        size="md"
                        className="border border-slate-200 hover:border-red-300 shadow-2xs"
                      />
                      <div className="relative">
                        <button
                          type="button"
                          onClick={handleShare}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-[#00407a] transition-all hover:scale-105 shadow-2xs cursor-pointer"
                          aria-label={t('shareProduct')}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        {shareMenuOpen && (
                          <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 p-2 min-w-[160px] z-20">
                            <button
                              type="button"
                              onClick={copyLink}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                            >
                              {t('copyLink')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5. Pricing & Value Showcase */}
                  <div className="rounded-2xl p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50/20 border border-slate-200/80 shadow-2xs space-y-2">
                    {/* Wholesale Price badge on top */}
                    {priceType === 'wholesale' && (
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-50 text-[#00407a] border border-blue-200/80 font-black text-xs px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                          {t('wholesalePrice')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <div className="flex items-baseline gap-2.5 sm:gap-3 flex-wrap">
                        {priceType === 'wholesale' && effectiveDisplayPriceWithTax ? (
                          <div data-testid="pdp-tax-display" className="flex items-baseline gap-2.5 sm:gap-3 flex-wrap">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wide">
                                {locale === 'ru' ? 'Без НДС:' : locale === 'zh' ? '未含税：' : 'Excl. TAX:'}
                              </span>
                              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                                {formatPrice(displayPrice)}
                              </span>
                            </div>

                            <span className="text-slate-300 text-2xl font-light">|</span>

                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs sm:text-sm font-bold text-purple-700 uppercase tracking-wide">
                                {locale === 'ru' ? 'С НДС:' : locale === 'zh' ? '含税价：' : 'Incl. TAX:'}
                              </span>
                              <span className="text-3xl sm:text-4xl font-black text-purple-900 tracking-tight font-sans">
                                {formatPrice(effectiveDisplayPriceWithTax)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                            {formatPrice(displayPrice)}
                          </span>
                        )}

                        {priceType !== 'wholesale' && showOriginalPrice && showOriginalPrice > displayPrice && (
                          <span className="text-base font-semibold text-slate-400 line-through decoration-slate-400">
                            {formatPrice(showOriginalPrice)}
                          </span>
                        )}
                      </div>

                      {priceType !== 'wholesale' && showOriginalPrice && showOriginalPrice > displayPrice && discount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {locale === 'ru' ? `-${discount}% СКИДКА` : locale === 'zh' ? `-${discount}% 优惠` : `-${discount}% OFF`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Variant / Configurable Attribute Selectors */}
                  {optionKeys.length > 0 ? (
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/80 space-y-2.5">
                      {optionKeys.map((key) => {
                        const values = optionValuesMap[key] || []
                        const selectedVal = selectedOptions[key]
                        const isColor = key.toLowerCase() === 'color'

                        return (
                          <div key={key} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                {key.charAt(0).toUpperCase() + key.slice(1)}:
                              </span>
                              <span className="text-xs font-bold text-[#00407a]">
                                {selectedVal || 'Select'}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
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
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                                        isSelected
                                          ? 'border-[#00407a] bg-[#EFF6FF] ring-2 ring-[#00407a]/20 text-[#00407a] font-bold shadow-xs'
                                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                      } ${!isAvailable ? 'opacity-50' : ''}`}
                                      title={val}
                                    >
                                      <span
                                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs flex-shrink-0"
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
                                    className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                                      isSelected
                                        ? 'border-[#00407a] bg-[#00407a] text-white shadow-xs'
                                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
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
                  ) : configurableAttributes.length > 0 ? (
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-200/80 space-y-2.5">
                      {configurableAttributes.map((attr) => {
                        const selectedVal = selectedOptions[attr.slug]
                        const selectedOpt = attr.options.find((o) => o.value === selectedVal)
                        const displaySelected = selectedOpt?.label || selectedVal

                        return (
                          <div key={attr.slug} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                {attr.name}:
                              </span>
                              <span className="text-xs font-bold text-[#00407a]">
                                {displaySelected || 'Select'}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {attr.options.map((opt) => {
                                const isSelected = selectedVal === opt.value

                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setSelectedOptions((prev) => ({ ...prev, [attr.slug]: opt.value }))}
                                    className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                                      isSelected
                                        ? 'border-[#00407a] bg-[#00407a] text-white shadow-xs'
                                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}

                  {/* Wholesale Options Matrix Card (if applicable) */}
                  {(isWholesale || isBoth) && matrixItems.length > 1 && (
                    <div className="bg-slate-50/60 rounded-xl border border-blue-200/80 p-3">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#00407a] text-white flex items-center justify-center shrink-0">
                            <Box className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xs text-slate-900">
                              {locale === 'ru' ? 'Оптовая матрица заказов' : locale === 'zh' ? '批发批量选型下单' : 'Wholesale Options Matrix'}
                            </h3>
                            <p className="text-[10px] text-slate-500">
                              {locale === 'ru' ? 'Укажите количество по каждому варианту' : locale === 'zh' ? '按规格输入订购数量' : 'Specify quantity per variant'}
                            </p>
                          </div>
                        </div>
                        <span className="border border-blue-300 text-[#00407a] bg-blue-50 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          B2B
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {matrixItems.map((item) => {
                          const qty = matrixQuantities[item.id] || 0
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white transition border border-slate-100 text-xs"
                            >
                              <div className="truncate min-w-0">
                                <span className="font-semibold text-slate-800 block truncate text-xs">{item.label}</span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {locale === 'ru' ? 'Артикул: ' : locale === 'zh' ? '商品编号: ' : 'Item #: '}
                                  {(product as any).dromkokItemNo || '—'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="font-mono font-bold text-xs text-slate-800">
                                  {formatPrice(item.price)}
                                </span>

                                <div className="flex items-center border border-slate-300 rounded-md bg-white shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMatrixQuantities((prev) => ({
                                        ...prev,
                                        [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                                      }))
                                    }
                                    className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 rounded-l-md cursor-pointer text-xs"
                                    disabled={qty <= 0}
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={qty === 0 ? '' : qty}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0
                                      setMatrixQuantities((prev) => ({
                                        ...prev,
                                        [item.id]: Math.max(0, val),
                                      }))
                                    }}
                                    className="w-10 text-center text-xs font-bold py-0.5 border-x border-slate-200 focus:outline-hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMatrixQuantities((prev) => ({
                                        ...prev,
                                        [item.id]: (prev[item.id] || 0) + 1,
                                      }))
                                    }
                                    className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 rounded-r-md cursor-pointer text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          {locale === 'ru' ? 'Всего:' : locale === 'zh' ? '总数:' : 'Total:'}
                          <span className="font-bold font-mono ml-1 text-slate-900">{totalMatrixUnits}</span>
                          {isWholesaleCustomer && (
                            <span className="text-[10px] text-slate-400 ml-1">(MOQ: {product.minOrderQty || 1})</span>
                          )}
                        </span>
                        <span className="font-black text-sm text-[#00407a]">
                          {formatPrice(totalMatrixPrice)}
                        </span>
                      </div>

                      {isUserLoggedIn ? (
                        <button
                          type="button"
                          disabled={totalMatrixUnits < (product.minOrderQty || 1) || adding}
                          onClick={isInstantWholesale ? handleMatrixAddToCart : handleMatrixAddToQuote}
                          className="w-full mt-2 bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs py-2 rounded-xl shadow-xs transition-colors cursor-pointer gap-1.5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>
                            {isInstantWholesale
                              ? (locale === 'ru' ? 'Добавить матрицу в корзину' : locale === 'zh' ? '批量加入购物车' : 'Add Assortment to Cart')
                              : (locale === 'ru' ? 'Добавить матрицу в заявку' : locale === 'zh' ? '批量加入报价单' : 'Add Assortment to Quote List')}
                          </span>
                        </button>
                      ) : (
                        <LocaleLink
                          href={`/sign-in?redirect=${encodeURIComponent(`/products/${product.slug}`)}`}
                          className="w-full mt-2 bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs py-2 rounded-xl shadow-xs transition-colors cursor-pointer gap-1.5 flex items-center justify-center"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>
                            {locale === 'ru' ? 'Войдите для заказа матрицы' : locale === 'zh' ? '登录以批量下单' : 'Sign In to Order Assortment'}
                          </span>
                        </LocaleLink>
                      )}
                    </div>
                  )}

                  {/* 6. Stock Status, Quantity Stepper & Real-time Subtotal */}
                  {(() => {
                    const stepperMinQty = isWholesaleActive ? (product.minOrderQty || 1) : 1
                    const stepperMaxQty = isWholesaleActive ? 999999 : (currentStock > 0 ? currentStock : 99)
                    const subtotal = displayPrice * quantity
                    const subtotalWithTax = isWholesaleActive && effectiveDisplayPriceWithTax ? effectiveDisplayPriceWithTax * quantity : null

                    return (
                      <div className="rounded-2xl p-3.5 bg-slate-50/80 border border-slate-200/80 space-y-3">
                        {/* Stock & Limit row */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {currentStock > 0 || isWholesaleActive ? (
                              <div className="inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-xs">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span>{t('inStock')}</span>
                              </div>
                            ) : (
                              <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-xs">
                                {t('outOfStock')}
                              </span>
                            )}
                          </div>

                          <span className="text-slate-500 text-[11px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                            {isWholesaleActive
                              ? `${tPdp('wholesaleMoq', { moq })}`
                              : (locale === 'ru' ? 'Макс. 10 шт.' : locale === 'zh' ? '限购10件' : 'Max 10 units')}
                          </span>
                        </div>

                        {/* Stepper + Subtotal Display */}
                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                              {locale === 'ru' ? 'Количество' : locale === 'zh' ? '数量' : (t('quantity') || 'Quantity')}
                            </span>
                            <div className="inline-flex items-center border border-slate-300 rounded-xl bg-white shadow-2xs p-0.5">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(-1)}
                                disabled={quantity <= stepperMinQty}
                                aria-label={locale === 'ru' ? 'Уменьшить количество' : locale === 'zh' ? '减少数量' : 'Decrease quantity'}
                                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={quantityInput}
                                disabled={!isWholesaleActive && currentStock <= 0}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, '')
                                  setQuantityInput(raw)
                                  const val = parseInt(raw, 10)
                                  if (!isNaN(val)) {
                                    if (val >= stepperMinQty && val <= stepperMaxQty) {
                                      setQuantity(val)
                                      if (moqError) setMoqError('')
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  let val = parseInt(quantityInput, 10)
                                  if (isNaN(val) || val < stepperMinQty) {
                                    val = stepperMinQty
                                  } else if (val > stepperMaxQty) {
                                    val = stepperMaxQty
                                  }
                                  setQuantity(val)
                                  setQuantityInput(String(val))
                                  if (moqError) setMoqError('')
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur()
                                  }
                                }}
                                className="w-16 sm:w-20 text-center font-black text-slate-900 bg-transparent text-sm sm:text-base focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(1)}
                                disabled={quantity >= stepperMaxQty}
                                aria-label={locale === 'ru' ? 'Увеличить количество' : locale === 'zh' ? '增加数量' : 'Increase quantity'}
                                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-right space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                              {locale === 'ru' ? 'Подытог заказа' : locale === 'zh' ? '订单小计' : (t('orderSubtotal') || 'Order Subtotal')}
                            </span>

                            {subtotalWithTax ? (
                              <div className="space-y-1">
                                <div className="flex items-baseline justify-end gap-2 flex-wrap">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                                      {locale === 'ru' ? 'Без НДС:' : locale === 'zh' ? '未含税:' : 'Excl. TAX:'}
                                    </span>
                                    <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                                      {formatPrice(subtotal)}
                                    </span>
                                  </div>

                                  <span className="text-slate-300 text-base font-light">|</span>

                                  <div className="flex items-baseline gap-1">
                                    <span className="text-[11px] font-bold text-purple-700 uppercase">
                                      {locale === 'ru' ? 'С НДС:' : locale === 'zh' ? '含税:' : 'Incl. TAX:'}
                                    </span>
                                    <span className="text-lg sm:text-2xl font-black text-purple-900 tracking-tight">
                                      {formatPrice(subtotalWithTax)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xl sm:text-2xl font-black text-[#00407a] tracking-tight leading-none">
                                {formatPrice(subtotal)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* 7. Primary Call to Action Buttons */}
                  {isUserLoggedIn && (
                    <div id="pdp-main-buy-box" className="space-y-2.5 pt-1">
                      {/* Wholesale RFQ Flow CTA */}
                      {isWholesaleActive && !isInstantWholesale ? (
                        <button
                          type="button"
                          onClick={handleAddToQuoteList}
                          disabled={currentStock === 0}
                          className="w-full h-11 bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{t('addToQuoteList')} ({tPdp('wholesaleMoq', { moq })})</span>
                        </button>
                      ) : isWholesaleActive && isInstantWholesale ? (
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          disabled={currentStock === 0 || adding}
                          className="w-full h-11 bg-[#F5A602] hover:bg-[#E09500] active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>{adding ? t('addingToCart') : t('addToCart')}</span>
                        </button>
                      ) : (
                        /* Retail Flow CTAs */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={currentStock === 0 || adding}
                            className="h-11 bg-[#F5A602] hover:bg-[#E09500] active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>{adding ? t('addingToCart') : t('addToCart')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleQuickOrder}
                            disabled={currentStock === 0 || adding}
                            className="h-11 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{locale === 'ru' ? 'Быстрый заказ' : locale === 'zh' ? '一键订购' : '1-Click Order'}</span>
                          </button>
                        </div>
                      )}

                      {/* Secondary option: If wholesale is active and store is BOTH, allow retail purchase */}
                      {isWholesaleActive && isBoth && (
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          disabled={currentStock === 0 || adding}
                          className="w-full h-10 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
                          <span>{locale === 'ru' ? 'Купить в розницу' : locale === 'zh' ? '以零售价购买' : 'Buy at Retail Price'} ({formatPrice(currentPrice)})</span>
                        </button>
                      )}

                      {/* Secondary option: If retail is active and store is BOTH, allow quote request */}
                      {!isWholesaleActive && isBoth && (
                        <button
                          type="button"
                          onClick={handleAddToQuoteList}
                          disabled={currentStock === 0}
                          className="w-full h-10 rounded-xl text-xs font-bold border-2 border-[#00407a] text-[#00407a] hover:bg-[#EFF6FF] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{isInstantWholesale ? t('addToCart') : t('addToQuoteList')}</span>
                        </button>
                      )}

                      {moqError && (
                        <p className="text-xs font-medium text-rose-600 text-center">{moqError}</p>
                      )}
                    </div>
                  )}

                  {/* Delivery & Fulfillment Information Box */}
                  {((settings as any)?.pdpCourierDeliveryBadgeEnabled !== false && (settings as any)?.pdpCourierDeliveryBadgeEnabled !== 'false') && (
                    <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 space-y-2.5 text-xs">
                      {/* Courier Delivery with Live Countdown */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              {locale === 'ru' ? 'Курьерская доставка' : locale === 'zh' ? '特快专递送达' : 'Courier Delivery'}
                            </span>
                            <span className="font-bold text-emerald-600 text-right ml-2">
                              {deliveryTimingEstimate}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>
                              {locale === 'ru'
                                ? `Закажите в течение ${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')} для быстрой отправки`
                                : locale === 'zh'
                                ? `在 ${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')} 内下单即刻排单发货`
                                : `Order within ${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')} for fastest dispatch`}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile-only Reassurance Strip & Frequently Bought Together Bundle */}
                <div className="lg:hidden space-y-4">
                  {reassuranceSection}
                  {bundleSection}
                </div>
              </div>
            </div>
          </div>

        {/* Full-width Modern Product Hub (Description, Specifications, Logistics, FAQ, Reviews) */}
        <div id="product-tabs" className="mt-6 mb-8 scroll-mt-24">
          <div className="border-b border-slate-200/90 bg-white rounded-t-2xl px-3 sm:px-6 pt-2 shadow-xs flex items-center justify-between flex-wrap gap-2">
            <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-1" aria-label="Tabs">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.id
                const tabIcon =
                  tab.id === 'overview' ? <Sparkles className="w-4 h-4" /> :
                  tab.id === 'product-details' ? <FileText className="w-4 h-4" /> :
                  tab.id === 'measurements' ? <Ruler className="w-4 h-4" /> :
                  tab.id === 'specs' ? <Layers className="w-4 h-4" /> :
                  <Star className="w-4 h-4" />

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative whitespace-nowrap py-3 px-3 sm:px-4 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/70 text-[#00407a] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className={isActive ? 'text-[#00407a]' : 'text-slate-400'}>
                      {tabIcon}
                    </span>
                    <span>{tab.label}</span>
                    {tab.count !== null && tab.count > 0 ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-[#00407a] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tab.count}
                      </span>
                    ) : null}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#00407a] rounded-full" />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Quick Article / Item # tag on the right (desktop) */}
            {displayArticleNumber && (
              <div className="hidden lg:flex items-center gap-2 py-2 pr-2 text-sm text-slate-500 font-sans">
                <span className="font-bold uppercase tracking-wider text-xs text-slate-500">
                  {locale === 'ru' ? 'Артикул:' : locale === 'zh' ? '商品编号:' : 'Item #:'}
                </span>
                <span className="font-extrabold text-slate-800 bg-slate-100 px-3 py-1 rounded-md border border-slate-200/80 text-sm">
                  {displayArticleNumber}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-b-2xl border-x border-b border-slate-200/80 p-5 sm:p-8 shadow-xs min-h-[360px]">
            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                {/* 1. Editorial Story & Lead Description */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/20 border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#00407a] text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      {locale === 'ru' ? 'Концепция и описание' : locale === 'zh' ? '设计理念与概览' : 'Design & Product Story'}
                    </span>
                  </div>

                  <div className="prose prose-slate max-w-none text-slate-800 text-base sm:text-lg leading-relaxed font-normal">
                    {/<[a-z][\s\S]*>/i.test(effectiveOverviewText) ? (
                      <div dangerouslySetInnerHTML={{ __html: effectiveOverviewText }} />
                    ) : (
                      <p className="whitespace-pre-wrap">{effectiveOverviewText}</p>
                    )}
                  </div>
                </div>

                {/* 2. Overview Highlights — only shown when admin has saved highlights in the form */}
                {overviewHighlightCards.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#00407a]" />
                        {locale === 'ru' ? 'Ключевые преимущества' : locale === 'zh' ? '核心产品亮点' : 'Key Highlights'}
                      </h4>
                      <span className="text-xs text-slate-400 font-medium">
                        {overviewHighlightCards.length} {locale === 'ru' ? 'особенностей' : locale === 'zh' ? '项优势' : 'features'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {overviewHighlightCards.map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all duration-200 group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-[#00407a] group-hover:text-white text-[#00407a] flex items-center justify-center mb-3 transition-colors shrink-0">
                            {feat.icon}
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-[#00407a] transition-colors">
                            {feat.title}
                          </h5>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {feat.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Guide - Only shown for apparel */}
                {isApparelCategory && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-50 text-purple-700 rounded-xl p-2.5 flex-shrink-0">
                          <Ruler className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">{t('sizeGuide')}</h4>
                          <p className="text-xs text-slate-500 mb-3">{t('findFit')}</p>
                          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                  <th className="px-3 py-1.5 text-left font-semibold">{t('sizeHeader')}</th>
                                  <th className="px-3 py-1.5 text-left font-semibold">US</th>
                                  <th className="px-3 py-1.5 text-left font-semibold">EU</th>
                                  <th className="px-3 py-1.5 text-left font-semibold">UK</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                <tr><td className="px-3 py-1.5 font-medium">S</td><td className="px-3 py-1.5">6-8</td><td className="px-3 py-1.5">36-38</td><td className="px-3 py-1.5">8-10</td></tr>
                                <tr><td className="px-3 py-1.5 font-medium">M</td><td className="px-3 py-1.5">8-10</td><td className="px-3 py-1.5">38-40</td><td className="px-3 py-1.5">10-12</td></tr>
                                <tr><td className="px-3 py-1.5 font-medium">L</td><td className="px-3 py-1.5">10-12</td><td className="px-3 py-1.5">40-42</td><td className="px-3 py-1.5">12-14</td></tr>
                                <tr><td className="px-3 py-1.5 font-medium">XL</td><td className="px-3 py-1.5">12-14</td><td className="px-3 py-1.5">42-44</td><td className="px-3 py-1.5">14-16</td></tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Product Details */}
            {activeTab === 'product-details' && (
              <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                {/* 1. Key Features — only shown when admin explicitly added bullet points */}
                {parsedProductDetails.keyFeatures.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#00407a]" />
                      {locale === 'ru' ? 'Главные черты' : locale === 'zh' ? '主要特点' : 'Key features'}
                    </h4>
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
                      <ul className="space-y-3">
                        {parsedProductDetails.keyFeatures.map((kf, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
                            <span className="w-2 h-2 rounded-full bg-[#00407a] mt-1.5 shrink-0" />
                            <span>{kf}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. What's Included — only when admin filled in the field */}
                {whatsIncluded && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-indigo-600" />
                      {locale === 'ru' ? 'Что включено в комплект' : locale === 'zh' ? '包含组件' : "What's included"}
                    </h4>
                    <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {whatsIncluded}
                    </div>
                  </div>
                )}

                {/* 3. Materials — only when admin filled in the Materials field */}
                {materials && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#00407a]" />
                      {locale === 'ru' ? 'Материалы' : locale === 'zh' ? '材料与材质' : 'Materials'}
                    </h4>
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {materials}
                    </div>
                  </div>
                )}

                {/* 4. Care Instructions — only when admin filled in the Care field */}
                {careInstructions && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      {locale === 'ru' ? 'Уход' : locale === 'zh' ? '保养说明' : 'Care instructions'}
                    </h4>
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {careInstructions}
                    </div>
                  </div>
                )}

                {/* Empty state — when admin hasn't filled in any Product Details fields yet */}
                {parsedProductDetails.keyFeatures.length === 0 && !whatsIncluded && !materials && !careInstructions && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <FileText className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">
                      {locale === 'ru' ? 'Сведения о товаре не заполнены' : locale === 'zh' ? '暂无商品详情' : 'No product details yet'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {locale === 'ru' ? 'Администратор может добавить информацию в панели управления.' : locale === 'zh' ? '管理员可在后台填写商品详细信息。' : 'Admin can add details in the dashboard.'}
                    </p>
                  </div>
                )}



              </div>
            )}

            {/* Tab 3: Measurements */}
            {activeTab === 'measurements' && (
              <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                {/* Section A: Product Dimensions — only shown when dimensions exist */}
                {dimensionCards.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0">
                          <Ruler className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                            {locale === 'ru' ? 'Размеры изделия' : locale === 'zh' ? '产品尺寸与规格' : 'Product Measurements'}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {locale === 'ru' ? 'Физические габариты изделия' : locale === 'zh' ? '精确物理尺寸与规格参数' : 'Physical dimensions and specifications'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Dimensions Summary Pill */}
                      {dimensionsSummaryPill && (
                        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white border border-slate-200 text-[#00407a] shadow-2xs">
                          {dimensionsSummaryPill}
                        </span>
                      )}
                    </div>

                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {dimensionCards.map((card, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-2xs transition-all"
                          >
                            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                              {card.label}
                            </span>
                            <span className="text-base sm:text-lg font-black text-slate-900 block mt-1 font-mono">
                              {card.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section B: Packaging Information — only shown when packaging exists */}
                {packagingList && packagingList.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0">
                          <Box className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                            {locale === 'ru' ? 'Информация об упаковке' : locale === 'zh' ? '包装与物流规格' : 'Packaging & Shipping Details'}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {locale === 'ru' ? 'Габариты упаковки и масса брутто' : locale === 'zh' ? '包装尺寸与毛重参数' : 'Package dimensions & gross weight'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {packagingList.length} {packagingList.length === 1 ? 'Package' : 'Packages'}
                      </span>
                    </div>

                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {packagingList.map((pkg, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-200/80 p-4 bg-gradient-to-br from-slate-50/60 to-white shadow-2xs"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#00407a] border border-blue-100">
                                <Box className="w-3 h-3" />
                                {locale === 'ru' ? `Упаковка ${idx + 1}` : locale === 'zh' ? `包装件 ${idx + 1}` : `Package ${idx + 1}`}
                              </span>
                              {pkg.weight && (
                                <span className="text-xs font-mono font-bold text-[#00407a]">
                                  {pkg.weight}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {pkg.width && (
                                <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
                                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{locale === 'ru' ? 'Ширина' : locale === 'zh' ? '宽度' : 'Width'}</span>
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5 font-mono">{pkg.width}</span>
                                </div>
                              )}
                              {pkg.height && (
                                <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
                                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{locale === 'ru' ? 'Высота' : locale === 'zh' ? '高度' : 'Height'}</span>
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5 font-mono">{pkg.height}</span>
                                </div>
                              )}
                              {pkg.length && (
                                <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
                                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{locale === 'ru' ? 'Длина' : locale === 'zh' ? '长度' : 'Length'}</span>
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5 font-mono">{pkg.length}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                        <Truck className="w-4 h-4 text-[#00407a] shrink-0" />
                        <span>
                          {locale === 'ru'
                            ? 'Компактная упаковка разработана для безопасной транспортировки и оптимизации логистических затрат.'
                            : locale === 'zh'
                            ? '紧凑扁平化包装，经优化可保障跨国运输安全并减少物流损耗。'
                            : 'Flat-pack design optimized for international logistics, safe transit, and minimized shipping footprint.'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty state — when neither dimensions nor packaging are available */}
                {dimensionCards.length === 0 && (!packagingList || packagingList.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <Ruler className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">
                      {locale === 'ru' ? 'Размеры не указаны' : locale === 'zh' ? '暂无尺寸规格' : 'No measurements available yet'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {locale === 'ru' ? 'Администратор может добавить информацию в панели управления.' : locale === 'zh' ? '管理员可在后台填写商品尺寸与包装数据。' : 'Admin can add dimensions and packaging details in the dashboard.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Hidden Legacy Tabs (Preserved for future step-by-step reactivation) */}

            {/* Tab 4: Technical Specifications (Managed via /admin/attributes) */}
            {activeTab === 'specs' && hasCategoryAttributesData && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#00407a]" />
                      {t('specifications') || (locale === 'ru' ? 'Характеристики товара' : locale === 'zh' ? '规格参数' : 'Specifications')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {locale === 'ru' ? 'Параметры и спецификации' : locale === 'zh' ? '商品属性参数' : 'Product attributes & specifications'}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md self-start sm:self-auto">
                    {categoryAttributesWithValues.length} {locale === 'ru' ? 'атрибутов' : locale === 'zh' ? '项属性' : 'attributes'}
                  </span>
                </div>

                {/* Only attributes forms data (from /admin/attributes) - no extra general details */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                  <dl className="divide-y divide-slate-100">
                    {categoryAttributesWithValues.map((attr, idx) => (
                      <div
                        key={attr.key}
                        className={`grid grid-cols-1 sm:grid-cols-3 gap-2 py-3.5 px-4 sm:px-6 transition-colors ${
                          idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{attr.name}</dt>
                        <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm whitespace-pre-line">
                          {attr.displayValue}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {/* Tab 3: Packaging & B2B Logistics */}
            {activeTab === 'logistics' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Box className="w-5 h-5 text-blue-600" />
                    {locale === 'ru' ? 'Упаковка и B2B логистика' : locale === 'zh' ? '包装规格与物流运输' : 'Packaging & B2B Logistics'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {locale === 'ru'
                      ? 'Данные о мастер-коробах, объеме (CBM), таможенном коде и способах доставки.'
                      : locale === 'zh'
                      ? '出口外箱尺寸、净重毛重、体积(CBM)及国际海运空运条款。'
                      : 'Export master carton standards, gross/net weight, volume calculations (CBM) and shipping terms.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Packaging specs */}
                  <div className="rounded-2xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50/50">
                    <h4 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      {locale === 'ru' ? 'Параметры упаковки' : locale === 'zh' ? '装箱规格' : 'Packaging Specifications'}
                    </h4>
                    <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Вес единицы (нетто)' : locale === 'zh' ? '单件净重' : 'Unit Net Weight'}</dt>
                        <dd className="font-semibold text-slate-900">{product.weightKg || '0.8'} {locale === 'ru' ? 'кг' : locale === 'zh' ? '千克' : 'kg'}</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Вес с упаковкой (брутто)' : locale === 'zh' ? '单件毛重' : 'Gross Weight'}</dt>
                        <dd className="font-semibold text-slate-900">{((product.weightKg || 0.8) * 1.15).toFixed(2)} {locale === 'ru' ? 'кг' : locale === 'zh' ? '千克' : 'kg'}</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Тип тары' : locale === 'zh' ? '包装材质' : 'Package Type'}</dt>
                        <dd className="font-semibold text-slate-900">{locale === 'ru' ? '5-слойный экспортный гофрокороб' : locale === 'zh' ? '5层瓦楞出口标准纸箱' : '5-Ply Export Master Carton'}</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Габариты упаковки' : locale === 'zh' ? '装箱尺寸' : 'Dimensions'}</dt>
                        <dd className="font-semibold text-slate-900">
                          {product.dimensions
                            ? `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} cm`
                            : 'Standard export packing'}
                        </dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Расчетный объем (CBM)' : locale === 'zh' ? '预估体积 (CBM)' : 'Estimated CBM'}</dt>
                        <dd className="font-semibold text-slate-900">
                          {product.dimensions
                            ? `${((product.dimensions.length * product.dimensions.width * product.dimensions.height) / 1000000).toFixed(3)} m³`
                            : '~0.025 m³'}
                        </dd>
                      </div>
                      {product.hsCode && (
                        <div className="flex justify-between py-2.5">
                          <dt className="text-slate-500">{locale === 'ru' ? 'Код ТН ВЭД (HS Code)' : locale === 'zh' ? '海关编码 (HS Code)' : 'HS Code'}</dt>
                          <dd className="font-semibold text-blue-700">{product.hsCode}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Freight and shipping terms */}
                  <div className="rounded-2xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50/50">
                    <h4 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      {locale === 'ru' ? 'Условия отгрузки и фрахта' : locale === 'zh' ? '航线与贸易条款' : 'Shipping & Trade Terms'}
                    </h4>
                    <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Порт отправления' : locale === 'zh' ? '发货港口' : 'Port of Dispatch'}</dt>
                        <dd className="font-semibold text-slate-900">{locale === 'ru' ? 'Нинбо / Шанхай / Склад в Китае' : locale === 'zh' ? '宁波港 / 上海港 / 中国集运中心' : 'Ningbo / Shanghai / China Hub'}</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Базис поставки' : locale === 'zh' ? '贸易术语' : 'Supported Incoterms'}</dt>
                        <dd className="font-semibold text-slate-900">EXW, FOB, CIF, DDP</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Авиа доставка (DDP)' : locale === 'zh' ? '空运专线 (含税到门)' : 'Air Express (DDP)'}</dt>
                        <dd className="font-semibold text-emerald-700">{settings?.pdpAirFreightDays || (locale === 'ru' ? '5 – 8 рабочих дней' : locale === 'zh' ? '5 – 8个工作日' : '5 – 8 days')}</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Ж/Д доставка (CR Express)' : locale === 'zh' ? '中欧班列铁路集运' : 'CR Express Railway'}</dt>
                        <dd className="font-semibold text-indigo-700">{settings?.pdpRailFreightDays || (locale === 'ru' ? '14 – 20 рабочих дней' : locale === 'zh' ? '14 – 20个工作日' : '14 – 20 days')}</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Морской фрахт (FCL/LCL)' : locale === 'zh' ? '海运整柜/拼箱' : 'Sea Freight (FCL/LCL)'}</dt>
                        <dd className="font-semibold text-slate-900">{settings?.pdpSeaFreightDays || (locale === 'ru' ? '20 – 35 дней' : locale === 'zh' ? '20 – 35天' : '20 – 35 days')}</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Таможенное оформление' : locale === 'zh' ? '报关与清关' : 'Export Clearance'}</dt>
                        <dd className="font-semibold text-slate-900">{locale === 'ru' ? 'Предоставляется полный пакет документов' : locale === 'zh' ? '全套出口报关单据 & 产地证' : 'Full export documents & CO provided'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{locale === 'ru' ? 'Требуется расчет контейнерной партии или сборного груза?' : locale === 'zh' ? '需要计算整柜或拼箱物流费用？' : 'Need custom container calculation or LCL consolidation?'}</h5>
                    <p className="text-xs text-slate-600">{locale === 'ru' ? 'Наши логисты подготовят точный расчет фрахта до вашего склада.' : locale === 'zh' ? '我们的物流专员将为您提供精确的门到门运费报价。' : 'Our international logistics desk can calculate exact door-to-door freight for your destination.'}</p>
                  </div>
                  <Button
                    onClick={handleRequestQuote}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4 h-9 whitespace-nowrap shadow-xs"
                  >
                    {t('requestWholesaleQuote')}
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 4: FAQ & Inquiries */}
            {activeTab === 'faq' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-blue-600" />
                      {settings?.pdpFaqTitle || t('faqTitle')}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {settings?.pdpFaqSubtitle || t('faqSubtitle')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuestionForm(!showQuestionForm)}
                    className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    {settings?.pdpFaqAskBtn || t('askAQuestion')}
                  </Button>
                </div>

                {showQuestionForm && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-fade-in space-y-3">
                    <p className="text-xs font-semibold text-slate-800">{t('expertsHelp')}</p>
                    <textarea
                      placeholder={t('questionPlaceholder')}
                      className="w-full border border-slate-300 rounded-xl p-3 text-xs sm:text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all bg-white"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowQuestionForm(false)} className="text-xs">
                        {t('cancel')}
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                        {t('submitQuestion')}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      q: settings?.pdpFaq1Q || t('faq1q'),
                      a: (settings?.pdpFaq1A || t('faq1a', { n: product.minOrderQty })).replace(/\{moq\}/gi, String(product.minOrderQty || 1)),
                    },
                    {
                      q: settings?.pdpFaq2Q || t('faq2q'),
                      a: settings?.pdpFaq2A || t('faq2a'),
                    },
                    {
                      q: settings?.pdpFaq3Q || t('faq3q'),
                      a: settings?.pdpFaq3A || t('faq3a'),
                    },
                    {
                      q: settings?.pdpFaq4Q || t('faq4q'),
                      a: settings?.pdpFaq4A || t('faq4a'),
                    },
                    {
                      q: settings?.pdpFaq5Q || t('faq5q'),
                      a: settings?.pdpFaq5A || t('faq5a'),
                    },
                  ]
                    .filter((faq) => Boolean(faq.q && faq.a))
                    .map((faq, index) => (
                      <div key={index} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 hover:border-blue-200 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 rounded-xl p-2 flex-shrink-0 mt-0.5">
                            <HelpCircle className="w-4 h-4 text-blue-700" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 mb-1 text-sm">{faq.q}</h4>
                            <p className="text-slate-600 leading-relaxed text-xs">{faq.a}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Tab: Reviews */}
            {activeTab === 'reviews' && (
              <div className="max-w-4xl mx-auto animate-fade-in">
                <ReviewSection
                  productId={product.id}
                  productName={localized.name}
                  initialSummary={ratingSummary}
                />
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section - Design 3 UnifiedProductCard */}
        {relatedProducts.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-xs p-5 sm:p-6 border border-slate-200/90 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-0.5 tracking-tight">{t('youMayAlsoLike')}</h2>
                <p className="text-slate-500 text-xs sm:text-sm">{t('discoverSimilar')}</p>
              </div>
              {product.category && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/store?category=${product.category?.slug}`)}
                  className="border border-[#00407a] text-[#00407a] hover:bg-[#EFF6FF] font-bold rounded-xl px-4 text-xs sm:text-sm h-9"
                >
                  {t('viewAllIn', { name: localizedCategoryName })}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct, idx) => {
                const design3Product = mapDbProductToDesign3(relatedProduct)
                return (
                  <UnifiedProductCard
                    key={`${relatedProduct.id}-${idx}`}
                    product={design3Product}
                    onAddToCart={handleRelatedAddToCart}
                    onUpdateQuantity={handleRelatedUpdateQuantity}
                    cartQuantities={cartQuantities}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={(p) => toggleWishlist(p.id)}
                    onSelectProduct={(p) => {
                      if (p.slug) navigate(`/products/${p.slug}`)
                      else navigate(`/products/${p.id}`)
                    }}
                    variant="compact"
                  />
                )
              })}
            </div>
            {hasMoreRelated && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
                <Button
                  variant="outline"
                  disabled={loadingMoreRelated}
                  onClick={loadMoreRelatedProducts}
                  className="px-6 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-all text-xs sm:text-sm shadow-xs active:scale-95"
                >
                  {loadingMoreRelated ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#00407a]" />
                      Loading more products...
                    </span>
                  ) : (
                    <span>Load More Similar Products</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Pre-Footer Newsletter Bar */}
        <div className="mt-8 mb-4">
          <MotionReveal direction="up">
            <NewsletterBar />
          </MotionReveal>
        </div>

        {/* Sticky Mobile Buy Bar (shows when scrolled past main buy box in standalone PWA mode) */}
        <StickyBuyBar
          isVisible={showStickyBuyBar && isStandalone}
          price={displayPrice}
          compareAtPrice={showOriginalPrice}
          quantity={quantity}
          onQuantityChange={(newQty) => setQuantity(newQty)}
          onAddToCart={isWholesaleActive && !isInstantWholesale ? handleAddToQuoteList : handleAddToCart}
          isWholesale={isWholesaleActive}
          isInstantWholesale={isInstantWholesale}
          isAdding={adding}
          minQty={effectiveMinQty}
          maxQty={currentStock}
          productName={localized.name}
          productImage={currentImages[0]}
          isLoggedIn={isUserLoggedIn}
        />
      </Container>
    </div>
    </SharedLayout>
    </div>
    </>
  )
}