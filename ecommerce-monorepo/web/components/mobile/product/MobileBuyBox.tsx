'use client'

import React from 'react'
import { ShoppingCart, FileText, ShieldCheck, Truck, MessageSquare } from 'lucide-react'
import { Product } from '@/app/[locale]/design-3/types'
import { useCurrency } from '@/hooks/useCurrency'
import { useLocale } from 'next-intl'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { MobileQuantityStepper } from './MobileQuantityStepper'

interface MobileBuyBoxProps {
  product: Product
  quantity: number
  onQuantityChange: (qty: number) => void
  onAddToCart: () => void
  onInquireSupplier?: () => void
  isAdding?: boolean
  className?: string
}

export function MobileBuyBox({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onInquireSupplier,
  isAdding = false,
  className = '',
}: MobileBuyBoxProps) {
  const { formatPrice } = useCurrency()
  const locale = useLocale()
  const { isWholesaleSession } = useSessionMode()

  const hasDiscount = product.oldPrice && product.oldPrice > product.price
  const minQty = product.moq || 1

  return (
    <div
      data-testid="mobile-buy-box"
      className={`rounded-3xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 p-4 space-y-4 shadow-xs ${className}`}
    >
      {/* Price & MOQ Tier Header */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#00407a] dark:text-[#F5A602]">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.oldPrice!)}
              </span>
            )}
            <span className="text-xs text-gray-500">/ unit</span>
          </div>

          {product.moq && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {locale === 'zh'
                ? `起订量 (MOQ): ${product.moq} 件起批`
                : locale === 'ru'
                ? `Минимальный заказ: ${product.moq} шт.`
                : `Min. Order Quantity (MOQ): ${product.moq} units`}
            </p>
          )}
        </div>

        {/* Total Price Preview */}
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
            Subtotal
          </p>
          <p className="text-base font-extrabold text-gray-900 dark:text-white">
            {formatPrice(product.price * quantity)}
          </p>
        </div>
      </div>

      {/* Quantity Stepper Row */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
          {locale === 'zh' ? '采购数量' : locale === 'ru' ? 'Количество' : 'Order Quantity'}
        </span>
        <MobileQuantityStepper
          quantity={quantity}
          onChange={onQuantityChange}
          min={minQty}
          max={9999}
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={isAdding}
          className="w-full min-h-[50px] px-5 rounded-2xl bg-[#00407a] dark:bg-primary-600 hover:bg-[#00305c] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {isWholesaleSession ? (
            <>
              <FileText className="w-5 h-5" />
              <span>
                {locale === 'zh' ? '加入询价清单' : locale === 'ru' ? 'Запросить расчет цен' : 'Add to Quote Cart'}
              </span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              <span>
                {locale === 'zh' ? '立即加入购物车' : locale === 'ru' ? 'Добавить в корзину' : 'Add to Shopping Cart'}
              </span>
            </>
          )}
        </button>

        {onInquireSupplier && (
          <button
            type="button"
            onClick={onInquireSupplier}
            className="w-full min-h-[46px] px-4 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-transform touch-manipulation"
          >
            <MessageSquare className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>
              {locale === 'zh' ? '联系驻厂贸易专员' : locale === 'ru' ? 'Связаться с менеджером' : 'Direct Supplier Inquiry'}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
