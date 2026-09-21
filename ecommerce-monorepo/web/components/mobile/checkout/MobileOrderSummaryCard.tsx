'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronUp, ShoppingBag, Package } from 'lucide-react'
import { useCurrency } from '@/hooks/useCurrency'
import { useLocale } from 'next-intl'

export interface CheckoutSummaryItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string | null
}

interface MobileOrderSummaryCardProps {
  items: CheckoutSummaryItem[]
  subtotal: number
  shippingFee: number
  total: number
  className?: string
}

export function MobileOrderSummaryCard({
  items,
  subtotal,
  shippingFee,
  total,
  className = '',
}: MobileOrderSummaryCardProps) {
  const { formatPrice } = useCurrency()
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <div
      data-testid="mobile-order-summary-card"
      className={`rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 shadow-2xs overflow-hidden ${className}`}
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full p-3.5 flex items-center justify-between text-left touch-manipulation active:bg-gray-50 dark:active:bg-slate-850"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-[#00407a] dark:text-primary-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
              <span>
                {locale === 'zh'
                  ? `订单摘要 (${itemCount} 件)`
                  : locale === 'ru'
                  ? `Сводка заказа (${itemCount} шт)`
                  : `Order Summary (${itemCount} items)`}
              </span>
              {isOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-slate-400">
              {isOpen
                ? locale === 'zh'
                  ? '点击折叠商品明细'
                  : locale === 'ru'
                  ? 'Скрыть подробности'
                  : 'Tap to collapse items'
                : locale === 'zh'
                ? '查看全部商品与明细'
                : locale === 'ru'
                ? 'Нажмите для просмотра товаров'
                : 'Tap to view products'}
            </p>
          </div>
        </div>

        {/* Total on header */}
        <div className="text-right">
          <span className="text-sm font-black text-[#00407a] dark:text-[#F5A602]">
            {formatPrice(total)}
          </span>
        </div>
      </button>

      {/* Expanded Details */}
      {isOpen && (
        <div className="px-3.5 pb-4 pt-1 border-t border-gray-100 dark:border-slate-800 space-y-3 animate-in slide-in-from-top-2 duration-150">
          {/* Items mini list */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-2.5 text-xs">
                <div className="relative w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-900 overflow-hidden shrink-0 border border-gray-100 dark:border-slate-800">
                  {it.image ? (
                    <Image
                      src={it.image}
                      alt={it.name}
                      fill
                      sizes="40px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">
                    {it.name}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Qty: {it.quantity} × {formatPrice(it.price)}
                  </p>
                </div>
                <span className="font-bold text-gray-900 dark:text-white shrink-0">
                  {formatPrice(it.price * it.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Breakdown calculation */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-slate-400">
              <span>{locale === 'zh' ? '小计' : locale === 'ru' ? 'Подытог' : 'Subtotal'}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-slate-400">
              <span>{locale === 'zh' ? '运费' : locale === 'ru' ? 'Доставка' : 'Shipping'}</span>
              <span>
                {shippingFee > 0
                  ? formatPrice(shippingFee)
                  : locale === 'zh'
                  ? '免运费或待计算'
                  : locale === 'ru'
                  ? 'Бесплатно / уточняется'
                  : 'Free or Calculated next'}
              </span>
            </div>
            <div className="flex justify-between pt-1 font-black text-sm text-gray-900 dark:text-white border-t border-gray-100 dark:border-slate-800">
              <span>{locale === 'zh' ? '实付总额' : locale === 'ru' ? 'Итого' : 'Total'}</span>
              <span className="text-[#00407a] dark:text-[#F5A602]">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
