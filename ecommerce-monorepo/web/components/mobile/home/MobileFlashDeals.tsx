'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { ProductImage } from '@/components/ui/ProductImage'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Zap, Clock, Plus, Check, ChevronRight, ShoppingCart, FileText } from 'lucide-react'
import { Product } from '@/app/[locale]/design-3/types'
import { useCurrency } from '@/hooks/useCurrency'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { useMobile } from '@/components/MobileProvider'

interface MobileFlashDealsProps {
  deals: Product[]
  isLoading?: boolean
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  onViewAll?: () => void
  className?: string
}

export function MobileFlashDeals({
  deals,
  isLoading = false,
  onAddToCart,
  onSelectProduct,
  onViewAll,
  className = '',
}: MobileFlashDealsProps) {
  const router = useRouter()
  const locale = useLocale()
  const { formatPrice } = useCurrency()
  const { isWholesaleSession } = useSessionMode()
  const { isStandalone } = useMobile()

  // Countdown timer state (e.g. 06:45:12)
  const [timeLeft, setTimeLeft] = useState({ hours: 6, minutes: 42, seconds: 18 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return { hours: 12, minutes: 0, seconds: 0 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDigit = (num: number) => num.toString().padStart(2, '0')

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

  return (
    <section
      data-testid="mobile-flash-deals"
      aria-label="Flash Deals"
      className={`py-3 bg-gradient-to-b from-amber-500/5 to-transparent dark:from-amber-500/10 ${className}`}
    >
      {/* Section Header with Countdown Timer */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
            {locale === 'zh'
              ? '限时抢购'
              : locale === 'ru'
              ? 'Горящие скидки'
              : 'Flash Deals'}
          </h3>

          {/* Countdown timer pill */}
          <div className="flex items-center gap-1 text-[11px] font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md">
            <span>{formatDigit(timeLeft.hours)}</span>
            <span>:</span>
            <span>{formatDigit(timeLeft.minutes)}</span>
            <span>:</span>
            <span>{formatDigit(timeLeft.seconds)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAll || (() => router.push(`/${locale}/store?filter=deals`))}
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 active:opacity-75"
        >
          <span>{locale === 'zh' ? '更多' : locale === 'ru' ? 'Все' : 'View All'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards: 2-col grid in browser mode, horizontal scroll in standalone */}
      {isStandalone ? (
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar px-4 py-1 scroll-smooth snap-x snap-mandatory">
          {deals && deals.length > 0 ? (
            deals.map((product) => {
              const hasDiscount =
                product.oldPrice && product.oldPrice > product.price
              const discountPercent = hasDiscount
                ? Math.round(
                    ((product.oldPrice! - product.price) / product.oldPrice!) * 100
                  )
                : null

              return (
                <div
                  key={product.id}
                  onClick={() => handleCardClick(product)}
                  className="snap-start shrink-0 w-[156px] rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer active:scale-98 transition-transform touch-manipulation"
                >
                  {/* Product Image + Discount Badge */}
                  <div className="relative w-full aspect-square bg-gray-50 dark:bg-slate-900 p-2">
                    {discountPercent && (
                      <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] shadow-xs">
                        -{discountPercent}%
                      </span>
                    )}
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      category={product.category}
                      productName={product.name}
                      fill
                      sizes="156px"
                      className="object-contain p-2"
                      loading="eager"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-2.5 flex flex-col justify-between flex-1 gap-1.5">
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                      {product.name}
                    </h4>

                    <div className="mt-auto">
                      {/* Price and Action Row */}
                      <div className="flex items-end justify-between gap-1">
                        <div>
                          <div className="font-extrabold text-sm text-[#00407a] dark:text-[#F5A602]">
                            {formatPrice(product.price)}
                          </div>
                          {hasDiscount && (
                            <div className="text-[10px] text-gray-400 line-through">
                              {formatPrice(product.oldPrice!)}
                            </div>
                          )}
                          {product.moq && (
                            <div className="text-[10px] text-gray-500 dark:text-slate-400">
                              MOQ: {product.moq} pcs
                            </div>
                          )}
                        </div>

                        {/* Add Button */}
                        <button
                          type="button"
                          onClick={(e) => handleActionClick(e, product)}
                          aria-label={
                            isWholesaleSession
                              ? 'Request quote'
                              : 'Add to shopping cart'
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
                </div>
              )
            })
          ) : (
            <div className="w-full py-6 text-center text-xs text-gray-400">
              {locale === 'zh'
                ? '今日限时抢购正在更新中...'
                : locale === 'ru'
                ? 'Горящие предложения обновляются...'
                : 'Flash deals updating...'}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 py-1">
          {deals && deals.length > 0 ? (
            deals.map((product) => {
              const hasDiscount =
                product.oldPrice && product.oldPrice > product.price
              const discountPercent = hasDiscount
                ? Math.round(
                    ((product.oldPrice! - product.price) / product.oldPrice!) * 100
                  )
                : null

              return (
                <div
                  key={product.id}
                  onClick={() => handleCardClick(product)}
                  className="rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer active:scale-98 transition-transform touch-manipulation"
                >
                  {/* Product Image + Discount Badge */}
                  <div className="relative w-full aspect-square bg-gray-50 dark:bg-slate-900 p-2">
                    {discountPercent && (
                      <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] shadow-xs">
                        -{discountPercent}%
                      </span>
                    )}
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      category={product.category}
                      productName={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 200px"
                      className="object-contain p-2"
                      loading="eager"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-2.5 flex flex-col justify-between flex-1 gap-1.5">
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                      {product.name}
                    </h4>

                    <div className="mt-auto">
                      {/* Price and Action Row */}
                      <div className="flex items-end justify-between gap-1">
                        <div>
                          <div className="font-extrabold text-sm text-[#00407a] dark:text-[#F5A602]">
                            {formatPrice(product.price)}
                          </div>
                          {hasDiscount && (
                            <div className="text-[10px] text-gray-400 line-through">
                              {formatPrice(product.oldPrice!)}
                            </div>
                          )}
                          {product.moq && (
                            <div className="text-[10px] text-gray-500 dark:text-slate-400">
                              MOQ: {product.moq} pcs
                            </div>
                          )}
                        </div>

                        {/* Add Button */}
                        <button
                          type="button"
                          onClick={(e) => handleActionClick(e, product)}
                          aria-label={
                            isWholesaleSession
                              ? 'Request quote'
                              : 'Add to shopping cart'
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
                </div>
              )
            })
          ) : (
            <div className="col-span-2 py-6 text-center text-xs text-gray-400">
              {locale === 'zh'
                ? '今日限时抢购正在更新中...'
                : locale === 'ru'
                ? 'Горящие предложения обновляются...'
                : 'Flash deals updating...'}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
