'use client'

import React from 'react'
import { ArrowRight, Lock, CheckCircle } from 'lucide-react'
import { useCurrency } from '@/hooks/useCurrency'
import { useLocale } from 'next-intl'

interface MobileCheckoutStickyBarProps {
  currentStep: number // 1, 2, or 3
  total: number
  onNext: () => void
  disabled?: boolean
  isSubmitting?: boolean
  className?: string
}

export function MobileCheckoutStickyBar({
  currentStep,
  total,
  onNext,
  disabled = false,
  isSubmitting = false,
  className = '',
}: MobileCheckoutStickyBarProps) {
  const { formatPrice } = useCurrency()
  const locale = useLocale()

  const getButtonText = () => {
    if (isSubmitting) {
      return locale === 'zh'
        ? '正在提交订单...'
        : locale === 'ru'
        ? 'Оформление...'
        : 'Placing Order...'
    }

    if (currentStep === 1) {
      return locale === 'zh'
        ? '下一步：配送方式'
        : locale === 'ru'
        ? 'Далее: Доставка'
        : 'Continue to Delivery'
    }

    if (currentStep === 2) {
      return locale === 'zh'
        ? '下一步：支付结算'
        : locale === 'ru'
        ? 'Далее: Оплата'
        : 'Continue to Payment'
    }

    return locale === 'zh'
      ? `确认付款 (${formatPrice(total)})`
      : locale === 'ru'
      ? `Оплатить (${formatPrice(total)})`
      : `Place Order (${formatPrice(total)})`
  }

  return (
    <div
      data-testid="mobile-checkout-sticky-bar"
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-gray-200/80 dark:border-slate-800 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] ${className}`}
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* Total Price preview */}
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
            {locale === 'zh' ? '应付总额' : locale === 'ru' ? 'Итого к оплате' : 'Total Amount'}
          </span>
          <span className="text-lg font-black text-[#00407a] dark:text-[#F5A602] leading-tight truncate">
            {formatPrice(total)}
          </span>
        </div>

        {/* Action Button (>=48px tap target) */}
        <button
          type="button"
          onClick={onNext}
          disabled={disabled || isSubmitting}
          aria-label={getButtonText()}
          className="min-h-[48px] px-5 rounded-2xl bg-[#00407a] dark:bg-primary-600 hover:bg-[#00305c] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {currentStep === 3 ? (
            <Lock className="w-3.5 h-3.5 opacity-80" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          <span>{getButtonText()}</span>
        </button>
      </div>
    </div>
  )
}
