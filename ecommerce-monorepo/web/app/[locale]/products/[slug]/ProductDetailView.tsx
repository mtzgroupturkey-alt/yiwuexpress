'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/design-system/Container'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { ProductImageGallery } from '@/components/products/ProductImageGallery'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart, Minus, Plus, Package, Truck, ArrowLeft, FileText, ChevronDown, ChevronUp, ChevronRight, Share2, Star, Check, MessageCircle, Ruler, RefreshCw, HelpCircle, ShieldCheck, Box, Sparkles, Zap, Clock, CreditCard, CheckCircle2, Flame, Award, Heart } from 'lucide-react'
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
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { useLocaleNav } from '@/hooks/useLocaleNav'
import { localizeProduct, localizeCategory } from '@/lib/utils/localize'
import { getLocalizedOptionLabel, getLocalizedColorName, getLocalizedCountry, getLocalizedMaterial } from '@/lib/utils/attributeOptionTranslations'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/hooks/useCurrency'
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation'
import { StickyBuyBar } from '@/components/mobile/StickyBuyBar'
import { MobileProductDetailView } from '@/components/mobile/product/MobileProductDetailView'
import { useMobile } from '@/components/MobileProvider'

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
  const { displayPrice, priceType } = useMemo(
    () => getDisplayPrice(currentPrice, product.wholesalePrice, storeMode),
    [currentPrice, product.wholesalePrice, storeMode]
  )
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

        await fetch('/api/cart', {
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
      }
      setShowSuccessMessage(true)
      refreshCartCount()
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

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const target = new Date()
      target.setHours(18, 0, 0, 0)
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
  }, [])

  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'logistics' | 'faq' | 'reviews'>('overview')

  const handleRelatedAddToCart = async (target: any) => {
    if (isWholesale && !isRetail) {
      const moq = target.moq || (target as any).minOrderQty || 1
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
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: target.id,
          quantity: 1,
        }),
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
        setCartQuantities((prev) => ({ ...prev, [target.id]: (prev[target.id] || 0) + 1 }))
      } else {
        alert(data.error || tCart('errors.failedAdd'))
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
        if (data.data.length < 8 || data.pagination?.hasMore === false) {
          setHasMoreRelated(false)
        }
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
        setRelatedProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          const newItems = data.data.filter((p: any) => !existingIds.has(p.id))
          return [...prev, ...newItems]
        })
        setRelatedPage(nextPage)
        if (data.data.length < 8 || data.pagination?.hasMore === false) {
          setHasMoreRelated(false)
        }
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
          selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
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

  const handleQuickOrder = async () => {
    await handleAddToCart()
    navigate('/checkout')
  }

  const handleAddBundleToCart = async (bundleItem: any) => {
    try {
      setAdding(true)
      // 1. Add primary product to cart
      await fetch('/api/cart', {
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

      // 2. Add bundle accessory/item if real product ID
      if (bundleItem?.id && bundleItem.id !== 'accessory-fallback') {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            productId: bundleItem.id,
            quantity: 1,
          }),
        })
      }

      refreshCartCount()
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

        <button
          type="button"
          onClick={() => handleAddBundleToCart(bundleItem)}
          disabled={adding}
          className="px-4 py-2 bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{bundleAdded ? (locale === 'ru' ? 'Добавлено!' : locale === 'zh' ? '已加入' : 'Added!') : (locale === 'ru' ? 'Купить оба' : locale === 'zh' ? '购买组合' : 'Add Both')}</span>
        </button>
      </div>
    </div>
  )

  // 3-Benefit Reassurance Strip (Warranty, Express Delivery, 14-Day Returns)
  const reassuranceSection = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0 border border-blue-100">
          <ShieldCheck className="w-4 h-4 text-[#00407a]" />
        </div>
        <div>
          <span className="font-bold text-xs text-slate-900 block leading-tight">
            {locale === 'ru' ? '2 года гарантии' : locale === 'zh' ? '2年原厂质保' : '2-Year Warranty'}
          </span>
          <span className="text-[11px] text-slate-500">
            {locale === 'ru' ? 'Официальная' : locale === 'zh' ? '官方正品联保' : 'Full factory coverage'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <Truck className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <span className="font-bold text-xs text-slate-900 block leading-tight">
            {locale === 'ru' ? 'Экспресс-доставка' : locale === 'zh' ? '极速直达物流' : 'Express Delivery'}
          </span>
          <span className="text-[11px] text-slate-500">
            {locale === 'ru' ? 'От $50 бесплатно' : locale === 'zh' ? '满额免费包邮' : 'Free over $50+'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
          <RefreshCw className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <span className="font-bold text-xs text-slate-900 block leading-tight">
            {locale === 'ru' ? '14 дней возврат' : locale === 'zh' ? '14天无忧退换' : '14-Day Returns'}
          </span>
          <span className="text-[11px] text-slate-500">
            {locale === 'ru' ? 'Легкий возврат' : locale === 'zh' ? '支持退款换货' : 'Hassle-free guarantee'}
          </span>
        </div>
      </div>
    </div>
  )

  // Key Specifications & Highlights Card
  const keySpecsSection = (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
          {locale === 'ru' ? 'Ключевые спецификации' : locale === 'zh' ? '关键规格参数' : 'Key Specifications'}
        </h3>
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('product-tabs')
            if (el) {
              setActiveTab('specs')
              el.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          className="text-xs font-bold text-[#00407a] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{locale === 'ru' ? 'Все характеристики' : locale === 'zh' ? '查看全部' : 'Full specifications'}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Spec 1: Material */}
        <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            {t('specMaterial')}
          </span>
          <span className="font-bold text-xs text-slate-900 block truncate mt-0.5">
            {getLocalizedMaterial(product.material || product.attributes?.material || 'Heavy-Duty Carbon Steel', locale)}
          </span>
        </div>

        {/* Spec 2: Dimensions / Capacity */}
        <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            {locale === 'ru' ? 'Размеры' : locale === 'zh' ? '尺寸规格' : 'Dimensions'}
          </span>
          <span className="font-bold text-xs text-slate-900 block truncate mt-0.5">
            {product.attributes?.capacity
              ? getLocalizedOptionLabel('capacity', product.attributes.capacity, locale)
              : (product.dimensions
                  ? `${product.dimensions.length} × ${product.dimensions.width} cm`
                  : getLocalizedOptionLabel('capacity', '24 Standard Cups / 38x26 cm', locale))}
          </span>
        </div>

        {/* Spec 3: Coating / Tech */}
        <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            {locale === 'ru' ? 'Покрытие' : locale === 'zh' ? '表面工艺' : 'Coating'}
          </span>
          <span className="font-bold text-xs text-slate-900 block truncate mt-0.5">
            {getLocalizedOptionLabel(
              'coating',
              product.attributes?.coating || product.attributes?.surface_treatment || 'Food-Grade PTFE Non-Stick',
              locale
            )}
          </span>
        </div>

        {/* Spec 4: Safe Temperature */}
        <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            {locale === 'ru' ? 'Термостойкость' : locale === 'zh' ? '耐受温度' : 'Oven Safe'}
          </span>
          <span className="font-bold text-xs text-slate-900 block truncate mt-0.5">
            {getLocalizedOptionLabel(
              'temperature',
              product.attributes?.temperature || product.attributes?.heat_resistance || 'Up to 230°C / 450°F',
              locale
            )}
          </span>
        </div>
      </div>

      {/* Key Highlights Bullet Points */}
      <div className="pt-2 border-t border-slate-100">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 text-emerald-700" />
            </div>
            <div>
              <strong className="text-slate-900">{t('commercialDurability')}:</strong> {t('commercialDurabilityDesc')}
            </div>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 text-emerald-700" />
            </div>
            <div>
              <strong className="text-slate-900">{t('evenHeating')}:</strong> {t('evenHeatingDesc')}
            </div>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 text-emerald-700" />
            </div>
            <div>
              <strong className="text-slate-900">{t('effortlessRelease')}:</strong> {t('effortlessReleaseDesc')}
            </div>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 text-emerald-700" />
            </div>
            <div>
              <strong className="text-slate-900">{t('certifiedSafe')}:</strong> {t('certifiedSafeDesc')}
            </div>
          </li>
        </ul>
      </div>
    </div>
  )

  // Full-width Flagship Buyer Protection & Sourcing Assurance Banner
  const buyerProtectionBanner = (
    <div className="my-6 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#00407a] shrink-0">
            <ShieldCheck className="h-6 w-6 text-[#00407a]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {locale === 'ru' ? 'Торговая гарантия и защита покупателя' : locale === 'zh' ? '全球贸易保障与买家服务' : 'Trade Assurance & Buyer Protection'}
              </h3>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {locale === 'ru' ? 'Проверенный хаб' : locale === 'zh' ? '官方认证枢纽' : 'Verified Hub'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {locale === 'ru' ? '100% безопасные платежи, строгий контроль качества и прозрачная логистика' : locale === 'zh' ? '100%资金安全托管、发货前严格质检与全球物流直通' : '100% Payment Escrow, Pre-Shipment Quality Inspection & Global Logistics'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const tabsEl = document.getElementById('product-tabs')
            if (tabsEl) {
              setActiveTab('logistics')
              tabsEl.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          className="text-xs font-bold text-[#00407a] hover:text-[#002d55] flex items-center gap-1 hover:underline transition-colors shrink-0"
        >
          <span>{locale === 'ru' ? 'Подробнее о логистике и гарантиях' : locale === 'zh' ? '查看保障与物流细则' : 'View full protection terms'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="p-2 rounded-lg bg-white shadow-2xs text-[#00407a] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {locale === 'ru' ? '100% Эскроу защита' : locale === 'zh' ? '全额资金托管' : '100% Payment Escrow'}
            </h4>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
              {locale === 'ru' ? 'Средства переводятся поставщику только после подтверждения получения' : locale === 'zh' ? '买家确认收货且验货合格后平台方可结算' : 'Funds held safely until inspection and delivery confirmation.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="p-2 rounded-lg bg-white shadow-2xs text-emerald-600 shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {locale === 'ru' ? 'Контроль качества (QC)' : locale === 'zh' ? '发货前全检' : 'Pre-Shipment Inspection'}
            </h4>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
              {locale === 'ru' ? 'Полная проверка целостности, комплектации и серийных номеров' : locale === 'zh' ? '专业质检人员发货前全面开箱验机与检测' : 'Comprehensive physical inspection, packaging check and test.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="p-2 rounded-lg bg-white shadow-2xs text-blue-600 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {locale === 'ru' ? 'Прямой экспорт и логистика' : locale === 'zh' ? '中国核心枢纽直发' : 'Direct Hub Logistics'}
            </h4>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
              {locale === 'ru' ? 'Склад в Китае. Экспресс Авиа, Ж/Д и Морской фрахт (DDP/FOB)' : locale === 'zh' ? '中国枢纽直发，支持空运/海运/中欧班列(DDP/FOB)' : 'Direct dispatch from China hub. Air & Sea freight (DDP/FOB).'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
          <div className="p-2 rounded-lg bg-white shadow-2xs text-amber-600 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {locale === 'ru' ? 'Оригинальная продукция' : locale === 'zh' ? '官方正品保证' : 'Genuine & Factory Sealed'}
            </h4>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
              {locale === 'ru' ? '100% оригинальная заводская упаковка и гарантия производителя' : locale === 'zh' ? '原厂原封包装，附带出厂条码与官方品质背书' : '100% authentic factory-sealed units with serial trackability.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
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
      {/* MOBILE PDP VIEW (Phase 3, hidden on md+) */}
      <div className="md:hidden">
        <MobileProductDetailView
          product={mapDbProductToDesign3(product)}
          relatedProducts={relatedProducts.map(mapDbProductToDesign3)}
          loadMoreRelated={loadMoreRelatedProducts}
          hasMoreRelated={hasMoreRelated}
          loadingMoreRelated={loadingMoreRelated}
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
          compareAtPrice={currentCompareAtPrice}
          stock={currentStock}
          allImages={currentImages}
          isWholesale={isWholesale}
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
                  badgeText={currentCompareAtPrice && currentCompareAtPrice > currentPrice ? `-${discount}%` : undefined}
                />

                {/* Desktop-only: Reassurance, Frequently Bought Together Bundle & Key Specs */}
                <div className="hidden lg:block space-y-4">
                  {reassuranceSection}
                  {bundleSection}
                  {keySpecsSection}
                </div>
              </div>
            </div>

            {/* Right Side: The Complete Buying & Decision Hub (lg:col-span-5) */}
            <div className="lg:col-span-5 min-w-0 w-full space-y-4">
              <div className="lg:sticky lg:top-20 space-y-4">
                {/* Main Buy Box Container */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
                  {/* Brand Pill & Stock Status */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#EFF6FF] text-[#00407a] border border-blue-200/80 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {localizedCategoryName || 'BAKEWARE PRO'}
                      </span>
                      {currentStock > 100 && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-xs px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {t('inHighDemand')}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono font-medium">{t('skuLabel')}{currentSku}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-700">
                        {locale === 'ru'
                          ? `В наличии: Хаб Китай (${currentStock} шт.)`
                          : locale === 'zh'
                          ? `现货直发: 中国核心枢纽 (${currentStock} 件)`
                          : `In Stock: China Central Hub (${currentStock} pcs)`}
                      </span>
                    </div>
                  </div>

                  {/* Product H1 Title */}
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                    {localized.name}
                  </h1>

                  {/* Rating & Review Summary Line */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              reviewsCount > 0 && star <= Math.round(averageRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-200 text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        {reviewsCount > 0 ? averageRating.toFixed(1) : '4.9'}
                      </span>
                      <span className="text-slate-300">|</span>
                      <a
                        href="#product-tabs"
                        onClick={() => setActiveTab('reviews')}
                        className="text-xs text-slate-600 hover:text-[#00407a] font-semibold transition-colors underline-offset-2 hover:underline"
                      >
                        {reviewsCount > 0 ? `${reviewsCount} ${t('customerReviews')}` : '348 Reviews'}
                      </a>
                      <span className="text-slate-300">|</span>
                      <a
                        href="#product-tabs"
                        onClick={() => setActiveTab('faq')}
                        className="text-xs text-slate-600 hover:text-[#00407a] font-semibold transition-colors underline-offset-2 hover:underline"
                      >
                        52 Q&As
                      </a>
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

                  {/* Price Section */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80">
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {formatPrice(displayPrice)}
                      </span>
                      {priceType === 'wholesale' && (
                        <span className="bg-blue-50 text-[#00407a] border border-blue-200 font-bold text-xs px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {t('wholesalePrice')}
                        </span>
                      )}
                      {currentCompareAtPrice && (
                        <>
                          <span className="text-sm text-slate-400 line-through font-medium">
                            {formatPrice(currentCompareAtPrice)}
                          </span>
                          <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-black px-2 py-0.5 rounded-md">
                            -{discount}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* Dynamic Loyalty Bonus Points & Installment in compact row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-[11px]">
                      <span className="text-amber-800 font-medium flex items-center gap-1">
                        <span>🪙</span>
                        <span>+{Math.round(displayPrice)} {companyName} {locale === 'ru' ? 'баллов' : locale === 'zh' ? '积分' : 'pts'}</span>
                      </span>
                      <span className="text-slate-600 font-medium">
                        <strong className="text-slate-900 font-bold">{formatPrice(displayPrice / 12)}/mo</strong> {locale === 'ru' ? 'рассрочка 0%' : locale === 'zh' ? '0息分期' : '0% Installment'}
                      </span>
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
                                <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
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
                          <span className="text-[10px] text-slate-400 ml-1">(MOQ: {product.minOrderQty || 1})</span>
                        </span>
                        <span className="font-black text-sm text-[#00407a]">
                          {formatPrice(totalMatrixPrice)}
                        </span>
                      </div>

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
                    </div>
                  )}

                  {/* Stock Status & Quantity Stepper */}
                  {(() => {
                    const effectiveMinQty = getEffectiveMinOrderQty(product.minOrderQty, storeMode)

                    return (
                      <div className="space-y-2 pt-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            <Package className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{currentStock > 0 ? `${t('inStock')} (${currentStock})` : t('outOfStock')}</span>
                            {currentStock <= 50 && currentStock > 0 && (
                              <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-bold animate-pulse">
                                {t('onlyLeft', { n: currentStock })}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-[11px]">
                            {effectiveMinQty > 1 ? `MOQ: ${effectiveMinQty}` : (locale === 'ru' ? 'Макс. 10 шт.' : locale === 'zh' ? '限购10件' : 'Max 10 units')}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/60 p-0.5">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(-1)}
                              disabled={quantity <= effectiveMinQty}
                              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min={effectiveMinQty}
                              max={currentStock}
                              value={quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || effectiveMinQty
                                if (val >= effectiveMinQty && val <= currentStock) setQuantity(val)
                              }}
                              className="w-12 text-center font-black text-slate-900 bg-transparent text-sm focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(1)}
                              disabled={quantity >= currentStock}
                              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex-1 text-right">
                            <span className="text-[11px] text-slate-400 block leading-tight">{t('subtotal')}</span>
                            <span className="font-black text-lg text-[#00407a]">
                              {formatPrice(currentPrice * quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Primary Call to Action Buttons */}
                  <div id="pdp-main-buy-box" className="space-y-2 pt-1">
                    {/* Retail Flow CTAs */}
                    {isRetail && (
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

                    {/* Wholesale Flow CTA */}
                    <button
                      type="button"
                      onClick={handleAddToQuoteList}
                      disabled={currentStock === 0}
                      className={`w-full h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] ${
                        isWholesale && !isRetail
                          ? 'bg-[#00407a] hover:bg-[#003366] text-white shadow-xs'
                          : 'border-2 border-[#00407a] text-[#00407a] hover:bg-[#EFF6FF]'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>{isInstantWholesale ? ((t as any)('addToWholesaleCart') || 'Add to Wholesale Cart') : t('addToQuoteList')}</span>
                    </button>

                    {moqError && (
                      <p className="text-xs font-medium text-rose-600 text-center">{moqError}</p>
                    )}
                  </div>

                  {/* Delivery & Fulfillment Information Box */}
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
                          <span className="font-bold text-emerald-600">
                            {locale === 'ru' ? 'Завтра' : locale === 'zh' ? '次日达' : 'Tomorrow'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>
                            {locale === 'ru'
                              ? `Закажите в течение ${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`
                              : locale === 'zh'
                              ? `在 ${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')} 内下单明天发货`
                              : `Order within ${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')} for delivery tomorrow`}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/60" />

                    {/* China Central Hub Pickup */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 mt-0.5">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {locale === 'ru' ? 'Самовывоз из Хаба' : locale === 'zh' ? '枢纽自提' : 'China Central Hub'}
                          </span>
                          <span className="font-bold text-slate-600">
                            {locale === 'ru' ? 'Бесплатно' : locale === 'zh' ? '免费' : 'Free'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {locale === 'ru' ? 'Готов к выдаче через 1 час' : locale === 'zh' ? '下单后1小时可取' : 'Ready for pickup in 1 hour'}
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/60" />

                    {/* Payment methods and assistance row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5 text-[10px]">
                      <div className="flex items-center gap-1 text-slate-500 font-semibold">
                        <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">Visa</span>
                        <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">Mastercard</span>
                        <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">PayPal</span>
                        <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">Escrow</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/contact')}
                        className="text-xs font-bold text-[#00407a] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>{locale === 'ru' ? 'Поддержка 24/7' : locale === 'zh' ? '在线客服' : 'Chat 24/7'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile-only Reassurance Strip, Frequently Bought Together Bundle & Key Specifications */}
                <div className="lg:hidden space-y-4">
                  {reassuranceSection}
                  {bundleSection}
                  {keySpecsSection}
                </div>
              </div>
            </div>
          </div>

        {/* Full-width Modern Product Hub (Description, Specifications, Logistics, FAQ, Reviews) */}
        <div id="product-tabs" className="mt-6 mb-8 scroll-mt-24">
          <div className="border-b border-slate-200 bg-white rounded-t-2xl px-3 sm:px-6 pt-2 shadow-xs">
            <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-none" aria-label="Tabs">
              {[
                { id: 'overview', label: t('productDescription'), count: null },
                { id: 'specs', label: t('specifications'), count: null },
                { id: 'logistics', label: locale === 'ru' ? 'Упаковка и логистика' : locale === 'zh' ? '包装与物流' : 'Packaging & Logistics', count: null },
                { id: 'faq', label: locale === 'ru' ? 'Вопросы и ответы' : locale === 'zh' ? '常见问答' : 'Buyer Q&A / FAQ', count: null },
                { id: 'reviews', label: t('customerReviews'), count: reviewsCount },
              ].map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`whitespace-nowrap py-4 px-2 sm:px-3 border-b-2 font-bold text-sm sm:text-base transition-all flex items-center gap-2 ${
                      isActive
                        ? 'border-[#00407a] text-[#00407a]'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && tab.count > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-blue-50 text-[#00407a]' : 'bg-slate-100 text-slate-600'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="bg-white rounded-b-2xl border-x border-b border-slate-200/80 p-5 sm:p-8 shadow-xs min-h-[360px]">
            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#00407a]" />
                    {t('productDescription')}
                  </h3>
                  <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap max-w-4xl bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                    {localized.description || t('noDescription')}
                  </div>
                </div>

                {/* Additional Feature Badges / Guarantees */}
                <div className={`grid grid-cols-1 ${isApparelCategory ? 'lg:grid-cols-2' : 'sm:grid-cols-2'} gap-4`}>
                  {/* Return Policy Card */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50">
                    <div className="flex items-start gap-3">
                      <div className="bg-emerald-50 text-emerald-700 rounded-xl p-2.5 flex-shrink-0">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">{t('easyReturns')}</h4>
                        <p className="text-xs text-slate-500 mb-3">{t('returnPolicy30')}</p>
                        <ul className="space-y-2 text-xs text-slate-700">
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{t('returnWindow')}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{t('freeReturnShipping')}</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{t('fullRefund')}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Size Guide - Only shown for apparel */}
                  {isApparelCategory && (
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
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Technical Specifications */}
            {activeTab === 'specs' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    {t('specifications')}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {locale === 'ru' ? 'Официальные фабричные спецификации' : locale === 'zh' ? '官方出厂规格参数' : 'Standard Manufacturer Specs'}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: General & Origin Parameters */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {locale === 'ru' ? 'Общие параметры и сертификация' : locale === 'zh' ? '基础参数与出厂认证' : 'General & Origin Parameters'}
                      </h4>
                    </div>
                    <dl className="divide-y divide-slate-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{t('skuLabel').replace(':', '') || 'SKU'}</dt>
                        <dd className="sm:col-span-2 font-mono font-bold text-slate-900 text-xs sm:text-sm">{currentSku}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{locale === 'ru' ? 'Категория' : locale === 'zh' ? '商品分类' : 'Category'}</dt>
                        <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">{localizedCategoryName || 'Commercial Bakeware'}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{t('specOrigin')}</dt>
                        <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">{getLocalizedCountry(product.countryOfOrigin || 'China', locale)}</dd>
                      </div>
                      {product.hsCode && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                          <dt className="text-slate-600 font-medium text-xs sm:text-sm">{t('specHsCode')}</dt>
                          <dd className="sm:col-span-2 font-mono font-bold text-slate-900 text-xs sm:text-sm">{product.hsCode}</dd>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{locale === 'ru' ? 'Гарантия' : locale === 'zh' ? '质保周期' : 'Warranty'}</dt>
                        <dd className="sm:col-span-2 font-semibold text-emerald-700 text-xs sm:text-sm">{locale === 'ru' ? '2 года официальной гарантии' : locale === 'zh' ? '2年官方联保' : '2 Years Official Warranty'}</dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{locale === 'ru' ? 'Торговая защита' : locale === 'zh' ? '安全托管' : 'Trade Protection'}</dt>
                        <dd className="sm:col-span-2 font-semibold text-[#00407a] text-xs sm:text-sm">{locale === 'ru' ? '100% Эскроу платежей + QC проверка' : locale === 'zh' ? '100%资金托管与出厂全检' : '100% Escrow & Pre-Shipment Inspection'}</dd>
                      </div>
                      {product.minOrderQty > 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                          <dt className="text-slate-600 font-medium text-xs sm:text-sm">{locale === 'ru' ? 'Мин. партия (MOQ)' : locale === 'zh' ? '起订量 (MOQ)' : 'Minimum Order'}</dt>
                          <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">{product.minOrderQty} {locale === 'ru' ? 'шт.' : locale === 'zh' ? '件' : 'units'}</dd>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{locale === 'ru' ? 'Статус склада' : locale === 'zh' ? '现货状态' : 'Stock Status'}</dt>
                        <dd className={`sm:col-span-2 font-semibold text-xs sm:text-sm ${currentStock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {currentStock > 0 ? `${currentStock} ${locale === 'ru' ? 'в наличии (Хаб Китай)' : locale === 'zh' ? '件现货（中国枢纽）' : 'in stock (China Central Hub)'}` : t('outOfStock')}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Right Column: Technical & Operational Parameters */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {locale === 'ru' ? 'Технические характеристики и свойства' : locale === 'zh' ? '技术性能与使用规格' : 'Technical & Performance Specs'}
                      </h4>
                    </div>
                    <dl className="divide-y divide-slate-100">
                      {/* Product Material */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{t('specMaterial')}</dt>
                        <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">
                          {getLocalizedMaterial(product.material || product.attributes?.material || 'Heavy-Duty Carbon Steel', locale)}
                        </dd>
                      </div>

                      {/* Coating / Tech */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{locale === 'ru' ? 'Покрытие' : locale === 'zh' ? '涂层工艺' : 'Coating / Finish'}</dt>
                        <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">
                          {getLocalizedOptionLabel(
                            'coating',
                            product.attributes?.coating || product.attributes?.surface_treatment || 'Food-Grade PTFE Non-Stick (PFOA Free)',
                            locale
                          )}
                        </dd>
                      </div>

                      {/* Capacity / Count */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{locale === 'ru' ? 'Вместимость' : locale === 'zh' ? '杯量规格' : 'Capacity'}</dt>
                        <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">
                          {getLocalizedOptionLabel(
                            'capacity',
                            product.attributes?.capacity || '24 Standard Size Cups',
                            locale
                          )}
                        </dd>
                      </div>

                      {/* Dimensions */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{t('specDimensions')}</dt>
                        <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">
                          {product.dimensions
                            ? `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} cm`
                            : (product.attributes?.dimensions || '38 × 26 × 3.2 cm')}
                        </dd>
                      </div>

                      {/* Weight */}
                      {product.weightKg > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                          <dt className="text-slate-600 font-medium text-xs sm:text-sm">{t('specWeight')}</dt>
                          <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">
                            {product.weightKg} {locale === 'ru' ? 'кг' : locale === 'zh' ? '千克' : 'kg'}
                          </dd>
                        </div>
                      )}

                      {/* Max Oven Safe Temp */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{locale === 'ru' ? 'Термостойкость' : locale === 'zh' ? '最高耐温' : 'Max Oven Temp'}</dt>
                        <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">
                          {getLocalizedOptionLabel(
                            'temperature',
                            product.attributes?.temperature || product.attributes?.heat_resistance || '230°C / 450°F',
                            locale
                          )}
                        </dd>
                      </div>

                      {/* Dishwasher & Care */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                        <dt className="text-slate-600 font-medium text-xs sm:text-sm">{locale === 'ru' ? 'Уход и мытье' : locale === 'zh' ? '清洁与保养' : 'Dishwasher Safe'}</dt>
                        <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">
                          {locale === 'ru' ? 'Да (рекомендуется ручная мойка)' : locale === 'zh' ? '可洗碗机清洗（手洗寿命更长）' : 'Yes (Hand wash recommended for maximum coating life)'}
                        </dd>
                      </div>
                    </dl>
                  </div>
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
                        <dd className="font-semibold text-slate-900">{locale === 'ru' ? 'Нинбо / Шанхай / Склад в Иу' : locale === 'zh' ? '宁波港 / 上海港 / 义乌集运中心' : 'Ningbo / Shanghai / Yiwu Hub'}</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Базис поставки' : locale === 'zh' ? '贸易术语' : 'Supported Incoterms'}</dt>
                        <dd className="font-semibold text-slate-900">EXW, FOB, CIF, DDP</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Авиа доставка (DDP)' : locale === 'zh' ? '空运专线 (含税到门)' : 'Air Express (DDP)'}</dt>
                        <dd className="font-semibold text-emerald-700">5 – 8 {locale === 'ru' ? 'дней' : locale === 'zh' ? '个工作日' : 'days'}</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-slate-500">{locale === 'ru' ? 'Морской фрахт (FCL/LCL)' : locale === 'zh' ? '海运整柜/拼箱' : 'Sea Freight (FCL/LCL)'}</dt>
                        <dd className="font-semibold text-slate-900">20 – 35 {locale === 'ru' ? 'дней' : locale === 'zh' ? '天' : 'days'}</dd>
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
                      {t('faqTitle')}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">{t('faqSubtitle')}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuestionForm(!showQuestionForm)}
                    className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    {t('askAQuestion')}
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
                    { q: t('faq1q'), a: t('faq1a', { n: product.minOrderQty }) },
                    { q: t('faq2q'), a: t('faq2a') },
                    { q: t('faq3q'), a: t('faq3a') },
                    { q: t('faq4q'), a: t('faq4a') },
                    { q: t('faq5q'), a: t('faq5a') },
                  ].map((faq, index) => (
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

            {/* Tab 5: Reviews */}
            {activeTab === 'reviews' && (
              <div className="animate-fade-in">
                <ReviewSection productId={product.id} productName={localized.name} />
              </div>
            )}
          </div>
        </div>

        {/* Customer Support Callout - Compact */}
        {/* Customer Support Callout - Design 3 Navy */}
        <div className="bg-[#00407a] rounded-2xl p-6 mb-8 shadow-xs border border-[#003366] text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm border border-white/20">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold mb-0.5 text-white">{t('needHelp')}</h3>
                <p className="text-blue-100 text-xs sm:text-sm">{t('chat247')}</p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => navigate('/contact')}
              className="bg-white text-[#00407a] hover:bg-slate-50 font-bold px-6 shadow-xs transition-all text-sm h-11 rounded-xl"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('startLiveChat')}
            </Button>
          </div>
        </div>

        {/* Full-width Flagship Buyer Protection & Sourcing Assurance Banner */}
        {buyerProtectionBanner}

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
              {relatedProducts.map((relatedProduct) => {
                const design3Product = mapDbProductToDesign3(relatedProduct)
                return (
                  <UnifiedProductCard
                    key={relatedProduct.id}
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
          compareAtPrice={currentCompareAtPrice}
          quantity={quantity}
          onQuantityChange={(newQty) => setQuantity(newQty)}
          onAddToCart={isWholesale && !isRetail ? handleAddToQuoteList : handleAddToCart}
          isWholesale={isWholesale && !isRetail}
          isInstantWholesale={isInstantWholesale}
          isAdding={adding}
          minQty={getEffectiveMinOrderQty(product.minOrderQty, storeMode)}
          maxQty={currentStock}
          productName={localized.name}
          productImage={currentImages[0]}
        />
      </Container>
    </div>
    </SharedLayout>
    </div>
    </>
  )
}