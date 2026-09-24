'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, FileText, Plus, Minus, Loader2 } from 'lucide-react'
import { useCurrency } from '@/hooks/useCurrency'
import { useLocale } from 'next-intl'
import { useMobile } from '@/components/MobileProvider'

export interface StickyBuyBarProps {
  isVisible: boolean
  price: number
  compareAtPrice?: number | null
  quantity: number
  onQuantityChange: (qty: number) => void
  onAddToCart: () => void
  isWholesale?: boolean
  isInstantWholesale?: boolean
  isAdding?: boolean
  minQty?: number
  maxQty?: number
  productName?: string
  productImage?: string
}

export function StickyBuyBar({
  isVisible,
  price,
  compareAtPrice,
  quantity,
  onQuantityChange,
  onAddToCart,
  isWholesale = false,
  isInstantWholesale = false,
  isAdding = false,
  minQty = 1,
  maxQty = 9999,
  productName,
  productImage,
}: StickyBuyBarProps) {
  const { formatPrice } = useCurrency()
  const locale = useLocale()
  const { isStandalone } = useMobile()

  const buttonText = isWholesale && !isInstantWholesale
    ? (locale === 'zh' ? '立即询价' : locale === 'ru' ? 'Запросить расчет' : 'Request Quote')
    : (locale === 'zh' ? '加入购物车' : locale === 'ru' ? 'В корзину' : 'Add to Cart')

  const bottomOffset = isStandalone
    ? 'calc(64px + env(safe-area-inset-bottom, 0px))'
    : 'env(safe-area-inset-bottom, 0px)'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="md:hidden fixed left-0 right-0 z-30 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-6px_25px_rgba(0,0,0,0.1)] px-3 py-2 transition-all"
          style={{
            bottom: bottomOffset,
          }}
          role="region"
          aria-label="Sticky product purchase bar"
        >
          <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
            {/* Price & mini info */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {productImage && (
                <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden hidden xs:block">
                  <img
                    src={productImage}
                    alt={productName || 'Product thumbnail'}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-base font-black text-[#00407a] dark:text-[#c9a84c] leading-none">
                    {formatPrice(price)}
                  </span>
                  {compareAtPrice && compareAtPrice > price && (
                    <span className="text-[11px] text-slate-400 line-through">
                      {formatPrice(compareAtPrice)}
                    </span>
                  )}
                </div>
                {productName && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-[120px]">
                    {productName}
                  </p>
                )}
              </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onQuantityChange(Math.max(minQty, quantity - 1))}
                disabled={quantity <= minQty}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs transition disabled:opacity-40 cursor-pointer shadow-2xs active:scale-95"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-black text-xs text-slate-900 dark:text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(Math.min(maxQty, quantity + 1))}
                disabled={quantity >= maxQty}
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs transition disabled:opacity-40 cursor-pointer shadow-2xs active:scale-95"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={onAddToCart}
              disabled={isAdding}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95 disabled:opacity-60 ${
                isWholesale && !isInstantWholesale
                  ? 'bg-[#00407a] hover:bg-[#003366] text-white'
                  : 'bg-[#F5A602] hover:bg-[#E09500] text-slate-950'
              }`}
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isWholesale && !isInstantWholesale ? (
                <FileText className="w-4 h-4" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              <span className="whitespace-nowrap">{buttonText}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
