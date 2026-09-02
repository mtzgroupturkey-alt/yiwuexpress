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
  tags?: Array<'new' | 'bestseller' | 'sale' | 'wholesale' | 'limited' | 'featured'>
  brand?: string
  supplier?: string
  isFavorite?: boolean
  soldToday?: number
  isInStock?: boolean
  minOrderQty?: number
  isFlashSale?: boolean
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
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

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
        label: t.featured,
        icon: <Sparkles className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-navy-950 font-bold'
      }
    }
    if (product.isFlashSale || product.tags?.includes('sale')) {
      return {
        label: t.sale,
        icon: <Zap className="w-3 h-3 fill-current" />,
        className: 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold'
      }
    }
    if (product.tags?.includes('bestseller')) {
      return {
        label: t.bestseller,
        icon: <TrendingUp className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold'
      }
    }
    if (product.tags?.includes('new')) {
      return {
        label: t.new,
        icon: <Sparkles className="w-3 h-3" />,
        className: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold'
      }
    }
    return null
  }

  const tagBadge = getTagBadge()
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price
  const discountPercent = isOnSale 
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0

  const primaryImage = product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  const isAvailable = product.isInStock !== undefined ? product.isInStock : (product.stock === undefined || product.stock > 0)

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'group relative bg-white dark:bg-[#0d1e32] rounded-2xl overflow-hidden',
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
            src={imageError ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80' : primaryImage}
            alt={product.name}
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
          {isOnSale && (
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
          {/* Supplier / Brand Verified Row */}
          {(product.supplier || product.brand) && (
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
              <span className="font-semibold uppercase tracking-wider truncate max-w-[150px]">
                {product.brand || product.supplier}
              </span>
              <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <Shield className="w-3 h-3" />
                CE / ISO
              </span>
            </div>
          )}

          {/* Product Name Title */}
          <Link href={`/${activeLocale}/products/${product.slug}`}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm hover:text-[#c9a84c] transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Ratings & Reviews */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 text-[#c9a84c]">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-3.5 h-3.5',
                  i < Math.floor(product.rating || 5)
                    ? 'fill-[#c9a84c] text-[#c9a84c]'
                    : 'text-gray-300 dark:text-gray-600'
                )}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
            {(product.rating || 4.9).toFixed(1)}
          </span>
          <span className="text-[11px] text-gray-400">
            ({product.reviewCount || 38})
          </span>
        </div>

        {/* Pricing Display */}
        <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-baseline justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-gray-900 dark:text-[#e5c158]">
                ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {isOnSale && (
                <span className="text-xs text-gray-400 line-through">
                  ${product.compareAtPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>

            {product.wholesalePrice && (
              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                {t.wholesale}: ${product.wholesalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {product.minOrderQty && product.minOrderQty > 1 && (
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">
              {t.moq}: {product.minOrderQty}
            </span>
          )}
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
