'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ShoppingBag, ArrowLeft, FileText, ArrowRight } from 'lucide-react'
import { MobileHeader } from '../MobileHeader'
import { EmptyState } from '../EmptyState'
import { MobileCartItem, MobileCartItemData } from './MobileCartItem'
import { MobileCartSummary } from './MobileCartSummary'
import { MobileCartStickyBar } from './MobileCartStickyBar'

interface MobileCartPageProps {
  items: MobileCartItemData[]
  subtotal: number
  totalWeight?: number
  onUpdateQuantity: (id: string, qty: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: () => void
  onContinueShopping?: () => void
  updating?: boolean
  isWholesaleActive?: boolean
  onSwitchToQuoteCart?: () => void
  className?: string
}

export function MobileCartPage({
  items,
  subtotal,
  totalWeight = 0,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onContinueShopping,
  updating = false,
  isWholesaleActive = false,
  onSwitchToQuoteCart,
  className = '',
}: MobileCartPageProps) {
  const router = useRouter()
  const locale = useLocale()

  const isEmpty = !items || items.length === 0

  const handleBack = () => {
    if (onContinueShopping) {
      onContinueShopping()
    } else {
      router.push(`/${locale}/store`)
    }
  }

  return (
    <div
      data-testid="mobile-cart-page"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] pb-40 ${className}`}
    >
      {/* 1. Header with Back Navigation */}
      <MobileHeader
        showBack={true}
        onBack={handleBack}
        title={locale === 'zh' ? '我的购物车' : locale === 'ru' ? 'Корзина' : 'Shopping Cart'}
        showSearchToggle={false}
      />

      {/* Wholesale Mode Notice if active */}
      {isWholesaleActive && (
        <div className="mx-3 mt-3 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-[#00407a] dark:text-blue-400 shrink-0" />
            <p className="text-gray-800 dark:text-slate-200 truncate">
              {locale === 'zh'
                ? '当前处于批发大宗采购模式'
                : locale === 'ru'
                ? 'Активен режим оптовых заказов'
                : 'B2B Wholesale Mode is Active'}
            </p>
          </div>
          {onSwitchToQuoteCart && (
            <button
              type="button"
              onClick={onSwitchToQuoteCart}
              className="text-[#00407a] dark:text-blue-400 font-bold shrink-0 underline flex items-center gap-1"
            >
              <span>{locale === 'zh' ? '询价清单' : locale === 'ru' ? 'Смета' : 'Quote Cart'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* 2. Main Body Content */}
      {isEmpty ? (
        <div className="pt-12 px-4">
          <EmptyState
            icon={<ShoppingBag className="w-8 h-8 text-primary-600" />}
            title={locale === 'zh' ? '购物车空空如也' : locale === 'ru' ? 'Ваша корзина пуста' : 'Your Cart is Empty'}
            description={
              locale === 'zh'
                ? '挑选优质中国制造货源，享受一手工厂直供价格'
                : locale === 'ru'
                ? 'Добавьте товары из фабричного каталога прямо сейчас'
                : 'Explore thousands of verified factory direct products ready for shipping.'
            }
            actionLabel={locale === 'zh' ? '前往商城选购' : locale === 'ru' ? 'Начать покупки' : 'Start Shopping'}
            onAction={handleBack}
          />
        </div>
      ) : (
        <div className="p-3.5 space-y-3.5">
          {/* Cart Items List */}
          <div className="space-y-2.5">
            {items.map((item) => (
              <MobileCartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
                updating={updating}
              />
            ))}
          </div>

          {/* Cart Cost Summary & Coupon Code */}
          <MobileCartSummary
            subtotal={subtotal}
            totalWeight={totalWeight}
          />
        </div>
      )}

      {/* 3. Sticky Checkout Bottom Bar (docked right above BottomNav) */}
      {!isEmpty && (
        <MobileCartStickyBar
          itemCount={items.length}
          totalPrice={subtotal}
          onCheckout={onCheckout}
          disabled={updating}
          isWholesale={isWholesaleActive}
        />
      )}
    </div>
  )
}
