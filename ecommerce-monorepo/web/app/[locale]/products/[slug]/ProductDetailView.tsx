'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { ProductImageGallery } from '@/components/products/ProductImageGallery'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart, Minus, Plus, Package, Truck, ArrowLeft, FileText, ChevronDown, ChevronUp, ChevronRight, Share2, Star, Check, MessageCircle, Ruler, RefreshCw, HelpCircle, ShieldCheck, Box, Sparkles } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'logistics' | 'faq' | 'reviews'>('overview')

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
      <div className="bg-gradient-to-b from-gray-50 to-white py-4 pb-28 lg:pb-12">
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
            {/* Left Column: Image Gallery & Desktop Sourcing Security */}
            <div className="lg:col-span-6 animate-fade-in">
              <div className="lg:sticky lg:top-20 space-y-4">
                <ProductImageGallery
                  images={currentImages}
                  productName={localized.name}
                />

                {/* Sourcing Security & B2B Trade Assurance Card - DESKTOP ONLY here */}
                <div className="hidden lg:block rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          {locale === 'ru' ? 'Торговая гарантия и защита' : locale === 'zh' ? '贸易保障与买家服务' : 'Trade Assurance & Sourcing'}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {locale === 'ru' ? '100% защита сделки и контроль качества' : locale === 'zh' ? '100%资金保障与全检服务' : '100% Payment Escrow & Pre-Shipment QC'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold px-2 py-0.5">
                      {locale === 'ru' ? 'Проверен' : locale === 'zh' ? '已认证' : 'Verified'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block text-slate-800">
                          {locale === 'ru' ? 'Контроль качества' : locale === 'zh' ? '严格品控' : 'Quality Inspected'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {locale === 'ru' ? 'Инспекция перед отправкой' : locale === 'zh' ? '发货前全检' : 'Inspected before dispatch'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block text-slate-800">
                          {locale === 'ru' ? 'Прямой экспорт' : locale === 'zh' ? '中国直发' : 'Direct Export'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {locale === 'ru' ? 'Склад в Китае / Иу' : locale === 'zh' ? '中国发货 / 义乌集运' : 'China & Yiwu Logistics Hub'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block text-slate-800">
                          {locale === 'ru' ? 'Образцы и OEM' : locale === 'zh' ? '支持拿样' : 'Samples & OEM'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {locale === 'ru' ? 'Кастомная упаковка и лого' : locale === 'zh' ? '支持定制包装与logo' : 'Custom logo & packaging'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block text-slate-800">
                          {locale === 'ru' ? 'Авиа и Морской фрахт' : locale === 'zh' ? '多元物流' : 'Air & Sea Freight'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {locale === 'ru' ? 'FOB, CIF, DDP варианты' : locale === 'zh' ? '支持EXW/FOB/DDP' : 'EXW, FOB, DDP express'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      {locale === 'ru' ? 'Безопасная сделка гарантирована' : locale === 'zh' ? '平台信用保障交易' : 'Escrow Protected Order'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const tabsEl = document.getElementById('product-tabs')
                        if (tabsEl) {
                          setActiveTab('logistics')
                          tabsEl.scrollIntoView({ behavior: 'smooth' })
                        }
                      }}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {locale === 'ru' ? 'Условия доставки →' : locale === 'zh' ? '查看物流详情 →' : 'Logistics details →'}
                    </button>
                  </div>
                </div>
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

            {/* Wholesale Options Matrix Card */}
            {(isWholesale || isBoth) && matrixItems.length > 1 && (
              <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm p-4 mb-4">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-600 rounded-lg p-1.5 text-white">
                      <Box className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">
                        {locale === 'ru' ? 'Оптовая матрица заказов' : locale === 'zh' ? '批发批量选型下单' : 'Wholesale Options Matrix'}
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        {locale === 'ru'
                          ? 'Укажите количество по каждому варианту / цвету'
                          : locale === 'zh'
                          ? '按颜色/规格分别输入订购数量'
                          : 'Specify quantity per variant / color'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-xs">
                    {locale === 'ru' ? 'B2B Ассортимент' : locale === 'zh' ? '多规格采购' : 'Multi-Option'}
                  </Badge>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {matrixItems.map((item) => {
                    const qty = matrixQuantities[item.id] || 0
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100/80 transition border border-gray-100 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {Boolean('hex' in item && (item as any).hex) && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: (item as any).hex }}
                            />
                          )}
                          <div className="truncate">
                            <span className="font-semibold text-gray-800 block truncate">{item.label}</span>
                            <span className="text-[10px] font-mono text-gray-400">{item.sku}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-mono font-semibold text-gray-700">
                            {formatPrice(item.price)}
                          </span>

                          {/* Stepper */}
                          <div className="flex items-center border border-gray-300 rounded-md bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() =>
                                setMatrixQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                                }))
                              }
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md"
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
                              className="w-12 text-center text-xs font-bold py-1 border-x border-gray-200 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setMatrixQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: (prev[item.id] || 0) + 1,
                                }))
                              }
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Matrix Total & Action */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      {locale === 'ru' ? 'Всего единиц:' : locale === 'zh' ? '总订购量:' : 'Total Units:'}
                      <span className="font-bold font-mono ml-1 text-gray-900">{totalMatrixUnits}</span>
                      <span className="text-[11px] text-gray-400 ml-1">
                        (MOQ: {product.minOrderQty || 1})
                      </span>
                    </span>
                    <span className="font-bold text-sm text-blue-700">
                      {formatPrice(totalMatrixPrice)}
                    </span>
                  </div>

                  {totalMatrixUnits > 0 && totalMatrixUnits < (product.minOrderQty || 1) && (
                    <p className="text-[11px] text-amber-600 font-medium">
                      {t('quoteListMoqError', { n: product.minOrderQty || 1 })}
                    </p>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    disabled={totalMatrixUnits < (product.minOrderQty || 1) || adding}
                    onClick={isInstantWholesale ? handleMatrixAddToCart : handleMatrixAddToQuote}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {isInstantWholesale
                      ? (locale === 'ru' ? 'Добавить ассортимент в корзину' : locale === 'zh' ? '批量加入购物车' : 'Add Assortment to Cart')
                      : (locale === 'ru' ? 'Добавить ассортимент в заявку' : locale === 'zh' ? '批量加入报价单' : 'Add Assortment to Quote List')}
                  </Button>
                </div>
              </div>
            )}

            {/* Variant / Configurable Attribute Selectors */}
            {optionKeys.length > 0 ? (
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
            ) : configurableAttributes.length > 0 ? (
              <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100 shadow-sm space-y-4">
                {configurableAttributes.map((attr) => {
                  const selectedVal = selectedOptions[attr.slug]
                  const selectedOpt = attr.options.find((o) => o.value === selectedVal)
                  const displaySelected = selectedOpt?.label || selectedVal

                  return (
                    <div key={attr.slug} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          {attr.name}:
                        </span>
                        <span className="text-xs font-semibold text-primary-700">
                          {displaySelected || 'Select'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {attr.options.map((opt) => {
                          const isSelected = selectedVal === opt.value

                          if (attr.isColor) {
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
                            const hex = opt.hex || colorMap[opt.value.toLowerCase()] || opt.value

                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setSelectedOptions((prev) => ({ ...prev, [attr.slug]: opt.value }))}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                  isSelected
                                    ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20 text-primary-900 font-semibold shadow-xs'
                                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                                }`}
                                title={opt.label}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-xs flex-shrink-0"
                                  style={{ backgroundColor: hex }}
                                />
                                <span>{opt.label}</span>
                              </button>
                            )
                          }

                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setSelectedOptions((prev) => ({ ...prev, [attr.slug]: opt.value }))}
                              className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'border-primary-600 bg-primary-600 text-white shadow-xs'
                                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700 hover:bg-gray-50'
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

            {/* Sourcing Security & B2B Trade Assurance Card - MOBILE ONLY PLACEMENT */}
            <div className="block lg:hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm mb-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      {locale === 'ru' ? 'Торговая гарантия и защита' : locale === 'zh' ? '贸易保障与买家服务' : 'Trade Assurance & Sourcing'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {locale === 'ru' ? '100% защита сделки и контроль качества' : locale === 'zh' ? '100%资金保障与全检服务' : '100% Payment Escrow & Pre-Shipment QC'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold px-2 py-0.5">
                  {locale === 'ru' ? 'Проверен' : locale === 'zh' ? '已认证' : 'Verified'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block text-slate-800">
                      {locale === 'ru' ? 'Контроль качества' : locale === 'zh' ? '严格品控' : 'Quality Inspected'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {locale === 'ru' ? 'Инспекция перед отправкой' : locale === 'zh' ? '发货前全检' : 'Inspected before dispatch'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block text-slate-800">
                      {locale === 'ru' ? 'Прямой экспорт' : locale === 'zh' ? '中国直发' : 'Direct Export'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {locale === 'ru' ? 'Склад в Китае / Иу' : locale === 'zh' ? '中国发货 / 义乌集运' : 'China & Yiwu Logistics Hub'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block text-slate-800">
                      {locale === 'ru' ? 'Образцы и OEM' : locale === 'zh' ? '支持拿样' : 'Samples & OEM'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {locale === 'ru' ? 'Кастомная упаковка и лого' : locale === 'zh' ? '支持定制包装与logo' : 'Custom logo & packaging'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block text-slate-800">
                      {locale === 'ru' ? 'Авиа и Морской фрахт' : locale === 'zh' ? '多元物流' : 'Air & Sea Freight'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {locale === 'ru' ? 'FOB, CIF, DDP варианты' : locale === 'zh' ? '支持EXW/FOB/DDP' : 'EXW, FOB, DDP express'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  {locale === 'ru' ? 'Безопасная сделка гарантирована' : locale === 'zh' ? '平台信用保障交易' : 'Escrow Protected Order'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const tabsEl = document.getElementById('product-tabs')
                    if (tabsEl) {
                      setActiveTab('logistics')
                      tabsEl.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  {locale === 'ru' ? 'Условия доставки →' : locale === 'zh' ? '查看物流详情 →' : 'Logistics details →'}
                </button>
              </div>
            </div>

            {/* Quick Specs Snippet & Jump-to-Details */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 mb-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {locale === 'ru' ? 'Ключевые параметры' : locale === 'zh' ? '核心参数' : 'Key Highlights'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('product-tabs')
                    if (el) {
                      setActiveTab('specs')
                      el.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <span>{locale === 'ru' ? 'Все характеристики' : locale === 'zh' ? '查看全部参数' : 'Full specifications'}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {product.material && (
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] text-slate-500 block">{t('specMaterial')}</span>
                    <span className="font-semibold text-slate-800 truncate block">{getLocalizedMaterial(product.material, locale)}</span>
                  </div>
                )}
                {product.weightKg > 0 && (
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] text-slate-500 block">{t('specWeight')}</span>
                    <span className="font-semibold text-slate-800 block">{product.weightKg} {locale === 'ru' ? 'кг' : locale === 'zh' ? '千克' : 'kg'}</span>
                  </div>
                )}
                {product.countryOfOrigin && (
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] text-slate-500 block">{t('specOrigin')}</span>
                    <span className="font-semibold text-slate-800 block">{getLocalizedCountry(product.countryOfOrigin, locale)}</span>
                  </div>
                )}
                {product.hsCode && (
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] text-slate-500 block">{t('specHsCode')}</span>
                    <span className="font-semibold text-slate-800 block">{product.hsCode}</span>
                  </div>
                )}
                {product.minOrderQty > 1 && (
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] text-slate-500 block">{locale === 'ru' ? 'Мин. заказ (MOQ)' : locale === 'zh' ? '起订量 (MOQ)' : 'MOQ'}</span>
                    <span className="font-semibold text-slate-800 block">{product.minOrderQty} {locale === 'ru' ? 'шт.' : locale === 'zh' ? '件' : 'units'}</span>
                  </div>
                )}
                <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block">{locale === 'ru' ? 'Статус склада' : locale === 'zh' ? '现货状态' : 'Stock Status'}</span>
                  <span className={`font-semibold block ${currentStock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {currentStock > 0 ? `${currentStock} ${locale === 'ru' ? 'в наличии' : locale === 'zh' ? '现货' : 'in stock'}` : t('outOfStock')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Modern Product Hub */}
        <div id="product-tabs" className="mt-10 mb-12 scroll-mt-24">
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
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && tab.count > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
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
                    <Sparkles className="w-5 h-5 text-blue-600" />
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

                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                  <dl className="divide-y divide-slate-100">
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
                                  <div key={attr.slug ?? `color-${idx}`} className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                                    <dt className="text-slate-600 font-medium text-xs sm:text-sm">{attr.name}</dt>
                                    <dd className="sm:col-span-2 flex flex-wrap gap-2 items-center">
                                      {colorVals.map((hex: string, ci) => {
                                        const cleanHex = hex.trim()
                                        const rawLabel = colorOpts.find((c: any) => c.value?.toLowerCase() === cleanHex.toLowerCase())?.label
                                        const label = getLocalizedColorName(cleanHex, rawLabel, locale)
                                        const isHex = cleanHex.startsWith('#')
                                        return (
                                          <div
                                            key={cleanHex ?? `color-val-${idx}-${ci}`}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-800"
                                          >
                                            {isHex && (
                                              <span
                                                className="inline-block w-4 h-4 rounded-full border border-black/15 shadow-2xs flex-shrink-0"
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
                                )
                              } else {
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
                                  <div key={attr.slug ?? `spec-${idx}`} className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                                    <dt className="text-slate-600 font-medium text-xs sm:text-sm">{attr.name}</dt>
                                    <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">{displayValue}</dd>
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
                                  <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                                    <dt className="text-slate-600 font-medium text-xs sm:text-sm">
                                      {locale === 'ru' ? 'Цвет' : locale === 'zh' ? '颜色' : 'Color'}
                                    </dt>
                                    <dd className="sm:col-span-2 flex flex-wrap gap-2 items-center">
                                      {colorVals.map((hex: string, ci) => {
                                        const cleanHex = hex.trim()
                                        const label = getLocalizedColorName(cleanHex, undefined, locale)
                                        const isHex = cleanHex.startsWith('#')
                                        return (
                                          <div
                                            key={cleanHex ?? `color-val-${ci}`}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-800"
                                          >
                                            {isHex && (
                                              <span
                                                className="inline-block w-4 h-4 rounded-full border border-black/15 shadow-2xs flex-shrink-0"
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
                                  <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                                    <dt className="text-slate-600 font-medium text-xs sm:text-sm">{displayName}</dt>
                                    <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">{displayValue}</dd>
                                  </div>
                                )
                              }
                            })
                        }
                      }

                      // Core Product Info
                      allSpecs.push(
                        <div key="weight" className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                          <dt className="text-slate-600 font-medium text-xs sm:text-sm">{t('specWeight')}</dt>
                          <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">{product.weightKg} {locale === 'ru' ? 'кг' : locale === 'zh' ? '千克' : 'kg'}</dd>
                        </div>
                      )

                      if (product.hsCode) {
                        allSpecs.push(
                          <div key="hsCode" className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                            <dt className="text-slate-600 font-medium text-xs sm:text-sm">{t('specHsCode')}</dt>
                            <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">{product.hsCode}</dd>
                          </div>
                        )
                      }

                      if (product.countryOfOrigin) {
                        allSpecs.push(
                          <div key="origin" className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                            <dt className="text-slate-600 font-medium text-xs sm:text-sm">{t('specOrigin')}</dt>
                            <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">{getLocalizedCountry(product.countryOfOrigin, locale)}</dd>
                          </div>
                        )
                      }

                      if (product.material) {
                        allSpecs.push(
                          <div key="material" className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                            <dt className="text-slate-600 font-medium text-xs sm:text-sm">{t('specMaterial')}</dt>
                            <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">{getLocalizedMaterial(product.material, locale)}</dd>
                          </div>
                        )
                      }

                      if (product.dimensions && !renderedDimensions) {
                        allSpecs.push(
                          <div key="dimensions" className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-4 hover:bg-slate-50/80 transition-colors">
                            <dt className="text-slate-600 font-medium text-xs sm:text-sm">{t('specDimensions')}</dt>
                            <dd className="sm:col-span-2 font-semibold text-slate-900 text-xs sm:text-sm">
                              {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {locale === 'ru' ? 'см' : locale === 'zh' ? '厘米' : 'cm'}
                            </dd>
                          </div>
                        )
                      }

                      return allSpecs
                    })()}
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 shadow-md border border-blue-500 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="bg-white/20 rounded-2xl p-3 backdrop-blur-sm border border-white/30">
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
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6 shadow-md hover:shadow-lg transition-all text-sm h-11 rounded-xl"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('startLiveChat')}
            </Button>
          </div>
        </div>

        {/* Related Products Section - Compact */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 border border-slate-100 mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-0.5">{t('youMayAlsoLike')}</h2>
                <p className="text-slate-500 text-xs sm:text-sm">{t('discoverSimilar')}</p>
              </div>
              {product.category && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/products?category=${product.category?.slug}`)}
                  className="border border-primary-600 text-primary-700 hover:bg-primary-50 font-semibold rounded-xl px-4 text-xs sm:text-sm h-9"
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

        {/* Sticky Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-slate-500 truncate block max-w-[150px] sm:max-w-xs">{localized.name}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-gradient-gold">
                  {formatPrice(displayPrice)}
                </span>
                {priceType === 'wholesale' && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                    {t('wholesalePrice')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isRetail && (
                <Button
                  size="default"
                  onClick={handleAddToCart}
                  disabled={currentStock === 0 || adding}
                  className="rounded-xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-md h-10 px-4 text-xs sm:text-sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  {adding ? t('addingToCart') : t('addToCart')}
                </Button>
              )}
              {isWholesale && !isRetail && (
                <Button
                  size="default"
                  onClick={handleAddToQuoteList}
                  disabled={currentStock === 0}
                  className="rounded-xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-md h-10 px-4 text-xs sm:text-sm"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  {isInstantWholesale ? ((t as any)('addToWholesaleCart') || 'Add to Cart') : t('addToQuoteList')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
    </SharedLayout>
  )
}