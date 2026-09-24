'use client'

import React from 'react'
import Image from 'next/image'
import { ProductImage } from '@/components/ui/ProductImage'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Star, Plus, Check, ShoppingCart, FileText, Heart, Package } from 'lucide-react'
import { Product } from '@/app/[locale]/design-3/types'
import { useCurrency } from '@/hooks/useCurrency'
import { useSessionMode } from '@/contexts/SessionModeContext'

interface MobileBestsellersGridProps {
  products: Product[]
  isLoading?: boolean
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  onToggleFavorite?: (productId: string) => void
  favoriteIds?: Set<string>
  onViewAll?: () => void
  className?: string
}

export function MobileBestsellersGrid({
  products,
  isLoading = false,
  onAddToCart,
  onSelectProduct,
  onToggleFavorite,
  favoriteIds,
  onViewAll,
  className = '',
}: MobileBestsellersGridProps) {
  const router = useRouter()
  const locale = useLocale()
  const { formatPrice } = useCurrency()
  const { isWholesaleSession } = useSessionMode()

  const handleCardClick = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product)
    } else {
      router.push(`/${locale}/products/${product.slug || product.id}`)
    }
  }

  const handleActionClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    if (onAddToCart) {
      onAddToCart(product, 1)
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite(productId)
    }
  }

  return (
    <section
      data-testid="mobile-bestsellers-grid"
      aria-label="Best Selling Products"
      className={`py-4 px-3 ${className}`}
    >
      <div className="flex items-center justify-between px-1 mb-3">
        <div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
            {locale === 'zh'
              ? '热销畅销榜'
              : locale === 'ru'
              ? 'Хиты продаж'
              : 'Best Selling Products'}
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            {locale === 'zh'
              ? '高复购率 · 优质工厂认证'
              : locale === 'ru'
              ? 'Проверенные фабрики и высокое качество'
              : 'Top re-ordered by global wholesale buyers'}
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll || (() => router.push(`/${locale}/store`))}
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 active:opacity-75"
        >
          {locale === 'zh' ? '查看全部' : locale === 'ru' ? 'Все товары' : 'View All'}
        </button>
      </div>

      {/* 2-Column Product Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {products && products.length > 0 ? (
          products.slice(0, 8).map((product) => {
            const isFav = favoriteIds ? favoriteIds.has(product.id) : false

            return (
              <div
                key={product.id}
                onClick={() => handleCardClick(product)}
                className="rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between cursor-pointer active:scale-98 transition-transform touch-manipulation"
              >
                {/* Thumbnail & Wishlist Button */}
                <div className="relative w-full aspect-square bg-gray-50 dark:bg-slate-900 p-2">
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={(e) => handleFavoriteClick(e, product.id)}
                      aria-label="Add to wishlist"
                      className="absolute top-2 right-2 z-10 min-w-[36px] min-h-[36px] rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs flex items-center justify-center text-gray-400 hover:text-rose-500 active:scale-90 transition-transform shadow-xs"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>
                  )}

                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    category={product.category}
                    productName={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 200px"
                    className="object-contain p-2"
                    loading="lazy"
                  />
                </div>

                {/* Details */}
                <div className="p-2.5 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                      {product.name}
                    </h4>

                    {/* Rating stars */}
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-gray-700 dark:text-slate-300">
                        {product.rating ? product.rating.toFixed(1) : '4.8'}
                      </span>
                      {product.reviewsCount ? (
                        <span>({product.reviewsCount})</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-end justify-between gap-1 pt-1 border-t border-gray-100 dark:border-slate-800/80">
                    <div>
                      <div className="font-extrabold text-sm text-[#00407a] dark:text-[#F5A602]">
                        {formatPrice(product.price)}
                      </div>
                      {product.moq && (
                        <div className="text-[10px] text-gray-400">
                          MOQ: {product.moq}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleActionClick(e, product)}
                      aria-label={
                        isWholesaleSession ? 'Request Quote' : 'Add to Cart'
                      }
                      className="min-w-[40px] min-h-[40px] rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform touch-manipulation"
                    >
                      {isWholesaleSession ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-2 py-8 text-center text-xs text-gray-400">
            {locale === 'zh'
              ? '商品正在上架中...'
              : locale === 'ru'
              ? 'Загрузка списка товаров...'
              : 'Loading products...'}
          </div>
        )}
      </div>
    </section>
  )
}
