'use client'

import React, { useState } from 'react'
import { Tag, ShieldCheck, Truck, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useCurrency } from '@/hooks/useCurrency'
import { useLocale } from 'next-intl'

interface MobileCartSummaryProps {
  subtotal: number
  totalWeight?: number
  estimatedShipping?: number
  tax?: number
  discount?: number
  onApplyPromoCode?: (code: string) => void
  appliedPromo?: string | null
  className?: string
}

export function MobileCartSummary({
  subtotal,
  totalWeight = 0,
  estimatedShipping = 0,
  tax = 0,
  discount = 0,
  onApplyPromoCode,
  appliedPromo = null,
  className = '',
}: MobileCartSummaryProps) {
  const { formatPrice } = useCurrency()
  const locale = useLocale()
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoInput, setPromoInput] = useState('')

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    if (promoInput.trim() && onApplyPromoCode) {
      onApplyPromoCode(promoInput.trim())
    }
  }

  const finalTotal = Math.max(0, subtotal + estimatedShipping + tax - discount)

  return (
    <div
      data-testid="mobile-cart-summary"
      className={`rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 p-4 space-y-4 shadow-2xs ${className}`}
    >
      {/* 1. Collapsible Promo Code Section */}
      <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setPromoOpen(!promoOpen)}
          aria-expanded={promoOpen}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-700 dark:text-slate-300 active:opacity-70 py-1"
        >
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span>
              {locale === 'zh'
                ? '使用优惠券 / 促销代码'
                : locale === 'ru'
                ? 'Промокод или купон'
                : 'Have a Promo Code or Voucher?'}
            </span>
          </div>
          {promoOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {promoOpen && (
          <form onSubmit={handleApply} className="flex gap-2 mt-2 pt-1 animate-in slide-in-from-top-2 duration-150">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder={locale === 'zh' ? '输入优惠券码' : locale === 'ru' ? 'Введите код' : 'Enter promo code'}
              className="flex-1 h-11 px-3 text-xs uppercase bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={!promoInput.trim()}
              className="min-h-[44px] px-4 rounded-xl bg-gray-900 dark:bg-slate-700 text-white font-bold text-xs disabled:opacity-40 active:scale-95 transition-transform"
            >
              {locale === 'zh' ? '使用' : locale === 'ru' ? 'Применить' : 'Apply'}
            </button>
          </form>
        )}

        {appliedPromo && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            ✓ Code &quot;{appliedPromo}&quot; applied successfully!
          </p>
        )}
      </div>

      {/* 2. Price Breakdown */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-gray-600 dark:text-slate-400">
          <span>{locale === 'zh' ? '商品小计' : locale === 'ru' ? 'Подытог' : 'Subtotal'}</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatPrice(subtotal)}
          </span>
        </div>

        {totalWeight > 0 && (
          <div className="flex justify-between text-gray-500 dark:text-slate-400 text-[11px]">
            <span>{locale === 'zh' ? '预估总重量' : locale === 'ru' ? 'Общий вес' : 'Total Cargo Weight'}</span>
            <span>{totalWeight.toFixed(2)} kg</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600 dark:text-slate-400">
          <span>{locale === 'zh' ? '运费计算' : locale === 'ru' ? 'Доставка' : 'Estimated Shipping'}</span>
          <span className="text-gray-900 dark:text-slate-300">
            {estimatedShipping > 0
              ? formatPrice(estimatedShipping)
              : locale === 'zh'
              ? '结账时计算'
              : locale === 'ru'
              ? 'Рассчитывается далее'
              : 'Calculated at checkout'}
          </span>
        </div>

        {tax > 0 && (
          <div className="flex justify-between text-gray-600 dark:text-slate-400">
            <span>{locale === 'zh' ? '税费' : locale === 'ru' ? 'Налог' : 'Estimated Tax'}</span>
            <span className="text-gray-900 dark:text-white">{formatPrice(tax)}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>{locale === 'zh' ? '优惠折扣' : locale === 'ru' ? 'Скидка' : 'Promo Discount'}</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline pt-2.5 border-t border-gray-100 dark:border-slate-800 text-sm font-extrabold text-gray-900 dark:text-white">
          <span>{locale === 'zh' ? '预计总额' : locale === 'ru' ? 'Итого к оплате' : 'Estimated Total'}</span>
          <span className="text-base text-[#00407a] dark:text-[#F5A602]">
            {formatPrice(finalTotal)}
          </span>
        </div>
      </div>

      {/* 3. Assurance Trust Strip */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-[10px] text-gray-500 dark:text-slate-400 text-center">
        <div className="flex flex-col items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>SSL Secured</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Truck className="w-4 h-4 text-[#00407a] dark:text-blue-400" />
          <span>Global Cargo</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <RefreshCw className="w-4 h-4 text-amber-600" />
          <span>Buyer Protection</span>
        </div>
      </div>
    </div>
  )
}
