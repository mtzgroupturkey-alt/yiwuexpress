'use client'

import React from 'react'
import { ArrowRight, Lock } from 'lucide-react'
import { useCurrency } from '@/hooks/useCurrency'
import { useLocale } from 'next-intl'

interface MobileCartStickyBarProps {
  itemCount: number
  totalPrice: number
  onCheckout: () => void
  disabled?: boolean
  isWholesale?: boolean
  className?: string
}

export function MobileCartStickyBar({
  itemCount,
  totalPrice,
  onCheckout,
  disabled = false,
  isWholesale = false,
  className = '',
}: MobileCartStickyBarProps) {
  const { formatPrice } = useCurrency()
  const locale = useLocale()

  return (
    <div
      data-testid="mobile-cart-sticky-bar"
      className={`fixed bottom-16 left-0 right-0 z-30 md:hidden bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-gray-200/80 dark:border-slate-800 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] ${className}`}
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* Total Price & Item Count */}
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
            {locale === 'zh'
              ? `共 ${itemCount} 件商品`
              : locale === 'ru'
              ? `${itemCount} тов. в корзине`
              : `Total (${itemCount} items)`}
          </span>
          <span className="text-lg font-black text-gray-900 dark:text-white leading-tight truncate">
            {formatPrice(totalPrice)}
          </span>
        </div>

        {/* Primary Checkout CTA */}
        <button
          type="button"
          onClick={onCheckout}
          disabled={disabled || itemCount === 0}
          aria-label={isWholesale ? 'Submit Wholesale Quote' : 'Proceed to Checkout'}
          className="min-h-[48px] px-6 rounded-2xl bg-[#00407a] dark:bg-primary-600 hover:bg-[#00305c] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Lock className="w-3.5 h-3.5 opacity-80" />
          <span>
            {isWholesale
              ? locale === 'zh'
                ? '提交批发询价'
                : locale === 'ru'
                ? 'Запросить расчет'
                : 'Submit Quote'
              : locale === 'zh'
              ? '去结算'
              : locale === 'ru'
              ? 'К оформлению'
              : 'Proceed to Checkout'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
