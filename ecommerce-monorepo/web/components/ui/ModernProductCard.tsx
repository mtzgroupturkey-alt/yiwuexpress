'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, 
  Heart, 
  Eye, 
  Star, 
  TrendingUp, 
  Truck, 
  Shield,
  CheckCircle,
  Sparkles,
  Zap,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation'
import { useCurrency } from '@/hooks/useCurrency'
import { useAuth } from '@/hooks/useAuth'
import { useCustomerView } from '@/hooks/useCustomerView'
import { getProductDisplayNames } from '@/lib/utils/productNames'

export interface ModernProductData {
  id: string
  name: string
  slug: string
  sku?: string
  price: number
  compareAtPrice?: number
  wholesalePrice?: number
  images?: string[]
  image?: string
  stock?: number
  rating?: number
  reviewCount?: number
  tags?: Array<'new' | 'bestseller' | 'sale' | 'wholesale' | 'limited' | 'featured' | 'express'>
  brand?: string
  supplier?: string
  isFavorite?: boolean
  soldToday?: number
  isInStock?: boolean
  minOrderQty?: number
  isFlashSale?: boolean
  taxRate?: number
  taxPercent?: number
  wholesalePriceWithTax?: number
  rawIkeaPayload?: any
  category?: string
  dromkokItemNo?: string
  ikeaItemNo?: string
}

interface ModernProductCardProps {
  product: ModernProductData
  variant?: 'default' | 'compact' | 'featured'
  className?: string
  onAddToCart?: (id: string) => void
  onQuickView?: (id: string) => void
  onToggleFavorite?: (id: string) => void
  locale?: 'en' | 'ru' | 'zh' | string
}

export function ModernProductCard({ 
  product, 
  variant = 'default',
  className,
  onAddToCart,
  onQuickView,
  onToggleFavorite,
  locale = 'en'
}: ModernProductCardProps) {
  const { tBadge } = useStorefrontTranslation()
  const { formatPrice } = useCurrency()
  const { isAuthenticated } = useAuth()
  const customerView = useCustomerView()
  const [mounted, setMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setMounted(true)
  }, [])

  const isWholesaleCustomer = customerView.isWholesale
  const isUserLoggedIn = mounted
    ? (isAuthenticated || (!customerView.isGuest && (customerView.isRetail || customerView.isWholesale)))
    : false
  const isRetailUserLoggedIn = isUserLoggedIn && customerView.isRetail

  // Pricing calculations
  const effectiveWholesalePrice = product.wholesalePrice || product.price || 0
  const displayPrice = isRetailUserLoggedIn ? product.price : effectiveWholesalePrice

  const effectiveTaxRate = (() => {
    const rawTax =
      product.taxRate ??
      product.taxPercent ??
      (product as any).rawIkeaPayload?.taxRate ??
      (product as any).rawIkeaPayload?.taxPercent
    if (rawTax !== undefined && rawTax !== null && !isNaN(Number(rawTax)) && Number(rawTax) > 0) {
      return Number(rawTax)
    }
    return 20 // Standard 20% VAT fallback
  })()

  const effectiveDisplayPriceWithTax = (() => {
    if (product.wholesalePriceWithTax && product.wholesalePriceWithTax > 0) {
      return product.wholesalePriceWithTax
    }
    if (displayPrice > 0) {
      return Math.round((displayPrice * (1 + effectiveTaxRate / 100) + Number.EPSILON) * 100) / 100
    }
    return null
  })()

  // Item # formatted as clean number only (e.g. "950.962.59")
  const rawItemNumber =
    product.dromkokItemNo ||
    product.ikeaItemNo ||
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

  const translations: Record<string, Record<string, string>> = {
    en: {
      addToCart: 'Add to Cart',
      quickView: 'Quick View',
      wholesale: 'Wholesale',
      soldToday: 'sold today',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      reviews: 'reviews',
      save: 'Save',
      new: 'New',
      bestseller: 'Bestseller',
      sale: 'Flash Deal',
      limited: 'Limited Stock',
      featured: 'Featured',
      moq: 'MOQ'
    },
    ru: {
      addToCart: 'В корзину',
      quickView: 'Быстрый просмотр',
      wholesale: 'Оптом',
      soldToday: 'продано сегодня',
      inStock: 'В наличии',
      outOfStock: 'Нет в наличии',
      reviews: 'отзывов',
      save: 'Экономия',
      new: 'Новинка',
      bestseller: 'Хит продаж',
      sale: 'Скидка',
      limited: 'Ограниченный запас',
      featured: 'Рекомендуем',
      moq: 'Мин. заказ'
    },
    zh: {
      addToCart: '加入购物车',
      quickView: '快速查看',
      wholesale: '大宗批发',
      soldToday: '今日已售',
      inStock: '现货充足',
      outOfStock: '暂时缺货',
      reviews: '条评价',
      save: '立省',
      new: '新品上市',
      bestseller: '热销爆款',
      sale: '限时秒杀',
      limited: '限量库存',
      featured: '官方精选',
      moq: '起订量'
    }
  }

  const activeLocale = locale in translations ? locale : 'en'
  const t = translations[activeLocale]

  // Mouse tracking for subtle 3D parallax tilt
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 14
      setMousePosition({ x, y })
    }

    const card = cardRef.current
    if (isHovered && card) {
      card.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [isHovered])

  const getTagBadge = () => {
    if (product.tags?.includes('featured') || variant === 'featured') {
      return {
        label: tBadge('featured') || t.featured,
        icon: <Sparkles className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-navy-950 font-bold'
      }
    }
    if (product.tags?.includes('express')) {
      return {
        label: tBadge('express'),
        icon: <Truck className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold'
      }
    }
    if (product.isFlashSale || product.tags?.includes('sale')) {
      return {
        label: tBadge('sale') || t.sale,
        icon: <Zap className="w-3 h-3 fill-current" />,
        className: 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold'
      }
    }
    if (product.tags?.includes('bestseller')) {
      return {
        label: tBadge('bestseller') || t.bestseller,
        icon: <TrendingUp className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold'
      }
    }
    if (product.tags?.includes('new')) {
      return {
        label: tBadge('new') || t.new,
        icon: <Sparkles className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold'
      }
    }
    if (product.tags?.includes('limited')) {
      return {
        label: tBadge('limited') || t.limited,
        icon: <Sparkles className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold'
      }
    }
    return null
  }

  const tagBadge = getTagBadge()
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price
  const discountPercent = isOnSale 
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0

  const primaryImage = product.images?.[0] || product.image || '/images/product-placeholder.webp'
  const isAvailable = product.isInStock !== undefined ? product.isInStock : (product.stock === undefined || product.stock > 0)
  const isStockAvailable = product.stock !== undefined ? product.stock > 0 : (product.isInStock !== false)
  const stockStatusLabel = isStockAvailable
    ? (activeLocale === 'ru' ? 'В наличии' : activeLocale === 'zh' ? '有现货' : 'In Stock')
    : (activeLocale === 'ru' ? 'Под заказ' : activeLocale === 'zh' ? '按需预定' : 'By Order')

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        '@container group relative bg-white dark:bg-[#0d1e32] rounded-2xl overflow-hidden',
        'border border-gray-100 dark:border-white/10',
        'shadow-lg hover:shadow-2xl hover:shadow-[#c9a84c]/20',
        'transition-all duration-300 ease-out flex flex-col',
        variant === 'featured' && 'md:col-span-2 md:row-span-2',
        className
      )}
      whileHover={{ 
        y: -6,
        transition: { duration: 0.25, ease: 'easeOut' }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setMousePosition({ x: 0, y: 0 })
      }}
    >
      {/* Top Gold Accent Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Image Container */}
      <div className={cn(
        'relative overflow-hidden bg-gray-50 dark:bg-[#070d16]',
        variant === 'featured' ? 'aspect-[16/10]' : 'aspect-square'
      )}>
        <motion.div
          className="w-full h-full relative"
          animate={{
            scale: isHovered ? 1.06 : 1,
            x: mousePosition.x * 0.4,
            y: mousePosition.y * 0.4,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-[#c9a84c]/30 border-t-[#c9a84c] animate-spin" />
            </div>
          )}
          
          <img
            src={imageError ? '/images/product-placeholder.webp' : primaryImage}
            alt={product.name}
            width={400}
            height={400}
            loading="lazy"
            decoding="async"
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true)
              setImageLoaded(true)
            }}
          />
        </motion.div>

        {/* Ambient Dark Gradient on Hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-[#070d16]/85 via-[#070d16]/30 to-transparent pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.9 : 0 }}
          transition={{ duration: 0.25 }}
        />

        {/* Quick Action Overlay on Hover */}
        <AnimatePresence>
          {isHovered && isAvailable && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center gap-2 p-4 z-20"
            >
              {isUserLoggedIn && (
                <Button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onAddToCart?.(product.id)
                  }}
                  className="bg-gradient-to-r from-[#c9a84c] to-[#e5c158] hover:from-[#b8963b] hover:to-[#c9a84c] text-navy-950 font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-[#c9a84c]/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {t.addToCart}
                </Button>
              )}

              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onQuickView?.(product.id)
                }}
                className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all cursor-pointer"
                title={t.quickView}
                aria-label={t.quickView}
              >
                <Eye className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badges Stack (Top Left) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
          {tagBadge && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-md backdrop-blur-sm',
              tagBadge.className
            )}>
              {tagBadge.icon}
              {tagBadge.label}
            </div>
          )}
          {isRetailUserLoggedIn && isOnSale && (
            <div className="bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-md">
              -{discountPercent}%
            </div>
          )}
          {product.wholesalePrice && (
            <div className="flex items-center gap-1 bg-[#1a3a5c]/90 border border-white/20 text-[#e5c158] text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md backdrop-blur-md">
              <Truck className="w-3 h-3" />
              {t.wholesale}
            </div>
          )}
        </div>

        {/* Wishlist Heart Toggle (Top Right) */}
        {isUserLoggedIn && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsFavorite(!isFavorite)
              onToggleFavorite?.(product.id)
            }}
            aria-label="Toggle Wishlist"
            className="absolute top-2.5 right-2.5 z-10 p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-white hover:text-red-400 transition-all hover:scale-110 cursor-pointer"
          >
            <Heart 
              className={cn(
                'w-4 h-4 transition-colors',
                isFavorite ? 'fill-red-500 text-red-500' : 'text-white'
              )} 
            />
          </button>
        )}

        {/* Out of Stock Overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-[#070d16]/75 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="text-white font-bold text-sm bg-black/60 px-3 py-1.5 rounded-lg border border-white/20">
              {t.outOfStock}
            </span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Category, Item # & Brand */}
          <div className="flex items-center text-[11px] text-gray-500 dark:text-gray-400 mb-1 gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 truncate flex-wrap min-w-0">
              {product.category && (
                <span className="text-[10px] font-semibold text-[#00407a] bg-blue-50 dark:bg-blue-900/40 dark:text-blue-200 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                  {product.category}
                </span>
              )}
              {displayItemNumber && (
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono tracking-tight shrink-0">
                  {displayItemNumber}
                </span>
              )}
              {(product.brand || product.supplier) && (
                <span className="font-semibold uppercase tracking-wider truncate max-w-[120px]">
                  {product.brand || product.supplier}
                </span>
              )}
            </div>
          </div>

          {/* Product Name Title: Swedish name line 1, English name line 2 */}
          {(() => {
            const { swedenName, englishName } = getProductDisplayNames(product);

            return (
              <Link href={`/${activeLocale}/products/${product.slug}`}>
                <h3 className="text-xs sm:text-sm leading-snug group-hover:text-[#c9a84c] transition-colors min-h-[36px]">
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
              </Link>
            );
          })()}
        </div>

        {/* Pricing Display */}
        <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-baseline justify-between gap-2">
          <div>
            {isRetailUserLoggedIn ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-lg font-black text-gray-900 dark:text-[#e5c158]">
                  {formatPrice(displayPrice)}
                </span>
                {isOnSale && product.compareAtPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex flex-col @[220px]:flex-row @[220px]:items-baseline gap-0.5 @[220px]:gap-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                      {activeLocale === 'ru' ? 'Без НДС:' : activeLocale === 'zh' ? '未含税：' : 'Excl. TAX:'}
                    </span>
                    <span className="text-sm sm:text-base font-black text-gray-900 dark:text-[#e5c158] tracking-tight font-sans">
                      {formatPrice(displayPrice)}
                    </span>
                  </div>

                  {effectiveDisplayPriceWithTax && (
                    <>
                      <span className="hidden @[220px]:inline text-gray-300 dark:text-gray-600 text-xs sm:text-sm font-light">|</span>

                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-tight">
                          {activeLocale === 'ru' ? 'С НДС:' : activeLocale === 'zh' ? '含税价：' : 'Incl. TAX:'}
                        </span>
                        <span className="text-sm sm:text-base font-black text-purple-900 dark:text-purple-300 tracking-tight font-sans">
                          {formatPrice(effectiveDisplayPriceWithTax)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {product.minOrderQty && product.minOrderQty > 1 && (
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10 shrink-0">
              {t.moq}: {product.minOrderQty}
            </span>
          )}
        </div>

        {/* Stock Status Badge (Left) & Star Rating (Right) on the same line after prices */}
        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-gray-100 dark:border-white/10">
          <span
            className={cn(
              'text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-wider uppercase shadow-xs shrink-0',
              isStockAvailable
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300'
            )}
          >
            {stockStatusLabel}
          </span>

          {/* Rating on right side after prices */}
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-[#c9a84c] text-[#c9a84c]" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {(product.rating || 4.9).toFixed(1)}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              ({product.reviewCount || 38})
            </span>
          </div>
        </div>

        {/* Bottom Social Proof Bar */}
        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-100 dark:border-white/5">
          {product.soldToday ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              🔥 {product.soldToday} {t.soldToday}
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {t.inStock}
            </span>
          )}

          <span className="text-gray-400 text-[10px]">
            Direct Factory
          </span>
        </div>
      </div>
    </motion.div>
  )
}
