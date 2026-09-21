'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  FileText,
  Building2,
  Truck,
  Trash2,
  Plus,
  Minus,
  Send,
  Calendar,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { ProductImage } from '@/components/ui/ProductImage'
import { MobileHeader } from '../MobileHeader'
import { EmptyState } from '../EmptyState'
import { QuoteCartItem } from '@/components/QuoteCartContext'

export interface GuestInfo {
  name: string
  email: string
  company: string
  phone: string
  taxId: string
}

export interface ShippingInfo {
  country: string
  city: string
  address: string
  targetDeliveryDate: string
  preferredShippingMode: string
}

export interface MobileQuoteCartPageProps {
  items: QuoteCartItem[]
  quoteCount: number
  totalUnits: number
  guestInfo: GuestInfo
  setGuestInfo: React.Dispatch<React.SetStateAction<GuestInfo>>
  shipping: ShippingInfo
  setShipping: React.Dispatch<React.SetStateAction<ShippingInfo>>
  customerNotes: string
  setCustomerNotes: (notes: string) => void
  submitting: boolean
  onQuantityChange: (productId: string, newQty: number, moq: number, selectedOptions?: Record<string, string> | null) => void
  onUpdateItem: (productId: string, updates: Partial<QuoteCartItem>, selectedOptions?: Record<string, string> | null) => void
  onRemoveItem: (productId: string, selectedOptions?: Record<string, string> | null) => void
  onClearCart: () => void
  onSubmit: (e: React.FormEvent) => void
  onBrowseCatalog: () => void
  className?: string
}

export function MobileQuoteCartPage({
  items,
  quoteCount,
  totalUnits,
  guestInfo,
  setGuestInfo,
  shipping,
  setShipping,
  customerNotes,
  setCustomerNotes,
  submitting,
  onQuantityChange,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  onSubmit,
  onBrowseCatalog,
  className = '',
}: MobileQuoteCartPageProps) {
  const router = useRouter()
  const locale = useLocale()

  const [isContactExpanded, setIsContactExpanded] = useState(true)
  const [isShippingExpanded, setIsShippingExpanded] = useState(true)

  const isEmpty = !items || items.length === 0

  const shippingModes = [
    { id: 'SEA', label: locale === 'zh' ? '海运拼箱/整柜' : locale === 'ru' ? 'Морской фрахт' : 'Sea Freight (FCL/LCL)' },
    { id: 'AIR', label: locale === 'zh' ? '空运极速专线' : locale === 'ru' ? 'Авиадоставка' : 'Air Freight (Express)' },
    { id: 'RAIL', label: locale === 'zh' ? '中欧班列铁路' : locale === 'ru' ? 'Ж/Д доставка' : 'Rail Freight' },
  ]

  return (
    <div
      data-testid="mobile-quote-cart-page"
      className={`md:hidden flex flex-col min-h-screen bg-slate-50 dark:bg-[#0b1120] pt-[calc(56px+env(safe-area-inset-top,0px))] pb-52 ${className}`}
    >
      {/* 1. Header with Back Navigation (Title matches App Style) */}
      <MobileHeader
        title={locale === 'zh' ? '询价请求单' : locale === 'ru' ? 'Запрос цен (RFQ)' : 'Quote Cart (RFQ)'}
        showBack={true}
        onBack={onBrowseCatalog}
        showSearch={false}
        showCart={false}
      />

      {/* 2. Empty State */}
      {isEmpty ? (
        <div className="pt-12 px-4 flex-1 flex items-center justify-center">
          <EmptyState
            icon={<FileText className="w-8 h-8 text-[#00407a] dark:text-blue-400" />}
            title={locale === 'zh' ? '询价清单为空' : locale === 'ru' ? 'Смета пуста' : 'Your Quote Cart is Empty'}
            description={
              locale === 'zh'
                ? '从中国源头工厂挑选商品加入询价单，获取阶梯出厂底价与专属物流方案'
                : locale === 'ru'
                ? 'Добавьте товары из оптового каталога для расчета фабричных цен и логистики'
                : 'Explore factory-direct wholesale products and submit an official RFQ for bulk commercial pricing.'
            }
            actionLabel={locale === 'zh' ? '浏览批发商城' : locale === 'ru' ? 'В каталог' : 'Explore Catalog'}
            onAction={onBrowseCatalog}
          />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col space-y-3.5 p-3 sm:p-4">
          {/* Top Wholesale Badge & Clear Action */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-blue-950 dark:text-blue-100 truncate">
                B2B Wholesale RFQ
              </span>
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700 shrink-0">
                {quoteCount} {locale === 'zh' ? '款' : 'Items'} · {totalUnits} {locale === 'zh' ? '件' : 'Units'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 shrink-0 px-2 py-1 active:opacity-70 touch-manipulation cursor-pointer"
            >
              {locale === 'zh' ? '清空' : locale === 'ru' ? 'Очистить' : 'Clear'}
            </button>
          </div>

          {/* Section: Products in RFQ */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {locale === 'zh' ? '询价商品清单' : locale === 'ru' ? 'Товары в запросе' : 'Products in Quote'} ({items.length})
              </h2>
            </div>

            {items.map((item, idx) => {
              const itemKey = item.variantId
                ? `${item.productId}-${item.variantId}`
                : `${item.productId}-${JSON.stringify(item.selectedOptions || {})}-${idx}`

              let opts = item.selectedOptions
              if (typeof opts === 'string') {
                try {
                  opts = JSON.parse(opts)
                } catch {
                  opts = null
                }
              }

              return (
                <div
                  key={itemKey}
                  data-testid={`quote-item-${item.productId}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-2xs space-y-3"
                >
                  {/* Top Item Summary */}
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative shrink-0 border border-slate-200 dark:border-slate-700">
                      <ProductImage
                        src={item.productImage}
                        alt={item.productName || 'Product image'}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {item.productName}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.productId, item.selectedOptions)}
                          aria-label={`Remove ${item.productName}`}
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 active:scale-95 transition-transform touch-manipulation cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        SKU: {item.productSku}
                      </p>

                      {/* Selected Options Pills */}
                      {opts && typeof opts === 'object' && Object.keys(opts).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {Object.entries(opts).map(([key, val]) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-[10px] font-medium border border-blue-200/80 dark:border-blue-800/60"
                            >
                              <span>{String(val)}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-1.5">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                          MOQ: {item.minOrderQty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Controls: Quantity Stepper & Target Price */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Quantity Stepper */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        {locale === 'zh' ? '询价数量' : locale === 'ru' ? 'Количество' : 'Quantity'}
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onQuantityChange(
                              item.productId,
                              item.quantity - 1,
                              item.minOrderQty,
                              item.selectedOptions
                            )
                          }
                          aria-label="Decrease quantity"
                          className="min-w-[40px] h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 active:bg-slate-200 dark:active:bg-slate-700 touch-manipulation cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={item.minOrderQty}
                          value={item.quantity}
                          onChange={(e) =>
                            onQuantityChange(
                              item.productId,
                              parseInt(e.target.value) || item.minOrderQty,
                              item.minOrderQty,
                              item.selectedOptions
                            )
                          }
                          className="w-full h-9 px-1 text-center font-bold font-mono text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#00407a]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onQuantityChange(
                              item.productId,
                              item.quantity + 1,
                              item.minOrderQty,
                              item.selectedOptions
                            )
                          }
                          aria-label="Increase quantity"
                          className="min-w-[40px] h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 active:bg-slate-200 dark:active:bg-slate-700 touch-manipulation cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Target Price */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        {locale === 'zh' ? '期望单价 ($)' : locale === 'ru' ? 'Целевая цена ($)' : 'Target Price ($)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.targetPrice ?? ''}
                          onChange={(e) =>
                            onUpdateItem(
                              item.productId,
                              { targetPrice: parseFloat(e.target.value) || null },
                              item.selectedOptions
                            )
                          }
                          className="w-full h-9 pl-6 pr-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:border-[#00407a]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Per-item customization notes */}
                  <div>
                    <input
                      type="text"
                      placeholder={
                        locale === 'zh'
                          ? '定制要求、包装或规格说明...'
                          : locale === 'ru'
                          ? 'Примечание, брендирование, упаковка...'
                          : 'Notes, branding, packaging requirements...'
                      }
                      value={item.customerNotes || ''}
                      onChange={(e) =>
                        onUpdateItem(
                          item.productId,
                          { customerNotes: e.target.value },
                          item.selectedOptions
                        )
                      }
                      className="w-full h-8 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00407a]"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Section: Business Contact Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
            <button
              type="button"
              onClick={() => setIsContactExpanded(!isContactExpanded)}
              className="w-full flex items-center justify-between text-left touch-manipulation cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#00407a] dark:text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  {locale === 'zh' ? '企业与联系人信息' : locale === 'ru' ? 'Контакты компании' : 'Business Contact Info'}
                </h3>
              </div>
              {isContactExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isContactExpanded && (
              <div className="space-y-2.5 pt-1 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {locale === 'zh' ? '联系人姓名' : locale === 'ru' ? 'Контактное лицо' : 'Contact Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00407a]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {locale === 'zh' ? '商务邮箱' : locale === 'ru' ? 'Рабочий Email' : 'Business Email'} *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00407a]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {locale === 'zh' ? '公司名称' : locale === 'ru' ? 'Компания' : 'Company'}
                    </label>
                    <input
                      type="text"
                      placeholder="Company Ltd"
                      value={guestInfo.company}
                      onChange={(e) => setGuestInfo((prev) => ({ ...prev, company: e.target.value }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00407a]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {locale === 'zh' ? '联系电话' : locale === 'ru' ? 'Телефон' : 'Phone'}
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 ..."
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00407a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {locale === 'zh' ? '税号 / VAT ID (可选)' : locale === 'ru' ? 'ИНН / VAT (опционально)' : 'Tax ID / VAT (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="Tax / VAT ID"
                    value={guestInfo.taxId}
                    onChange={(e) => setGuestInfo((prev) => ({ ...prev, taxId: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00407a]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Shipping & Delivery Preferences */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
            <button
              type="button"
              onClick={() => setIsShippingExpanded(!isShippingExpanded)}
              className="w-full flex items-center justify-between text-left touch-manipulation cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  {locale === 'zh' ? '目的港与物流偏好' : locale === 'ru' ? 'Доставка и логистика' : 'Shipping & Destination'}
                </h3>
              </div>
              {isShippingExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isShippingExpanded && (
              <div className="space-y-2.5 pt-1 text-xs">
                {/* Shipping Mode Pills */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {locale === 'zh' ? '优先物流方式' : locale === 'ru' ? 'Тип доставки' : 'Preferred Freight Mode'}
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {shippingModes.map((mode) => {
                      const isSelected = shipping.preferredShippingMode === mode.id
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setShipping((prev) => ({ ...prev, preferredShippingMode: mode.id }))}
                          className={`min-h-[40px] px-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors touch-manipulation cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-[#00407a] text-[#00407a] dark:text-blue-300 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{mode.label}</span>
                          {isSelected && <span className="text-[#00407a] dark:text-blue-300 font-bold">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {locale === 'zh' ? '国家/地区' : locale === 'ru' ? 'Страна' : 'Country'}
                    </label>
                    <input
                      type="text"
                      placeholder="Destination Country"
                      value={shipping.country}
                      onChange={(e) => setShipping((prev) => ({ ...prev, country: e.target.value }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00407a]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {locale === 'zh' ? '目的城市/港口' : locale === 'ru' ? 'Город/Порт' : 'City / Port'}
                    </label>
                    <input
                      type="text"
                      placeholder="Destination City"
                      value={shipping.city}
                      onChange={(e) => setShipping((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00407a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {locale === 'zh' ? '详细收货地址' : locale === 'ru' ? 'Адрес доставки' : 'Delivery Address'}
                  </label>
                  <input
                    type="text"
                    placeholder="Street, warehouse, building..."
                    value={shipping.address}
                    onChange={(e) => setShipping((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00407a]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {locale === 'zh' ? '期望交付日期' : locale === 'ru' ? 'Желаемая дата' : 'Target Delivery Date'}
                  </label>
                  <input
                    type="date"
                    value={shipping.targetDeliveryDate}
                    onChange={(e) => setShipping((prev) => ({ ...prev, targetDeliveryDate: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00407a]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Additional Notes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {locale === 'zh' ? '项目补充说明' : locale === 'ru' ? 'Дополнительные пожелания' : 'Additional Project Notes'}
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder={
                locale === 'zh'
                  ? '如需要产地证、验货报告或商检要求，请在此备注...'
                  : locale === 'ru'
                  ? 'Укажите требования к сертификатам, инспекции или таможне...'
                  : 'Certificates of Origin, QA inspection, or customs requirements...'
              }
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00407a]"
            />
          </div>

          {/* Fixed Bottom Action Bar (Positioned above BottomNav) */}
          <div
            className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          >
            <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {quoteCount} {locale === 'zh' ? '款商品' : 'Products'}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {totalUnits} {locale === 'zh' ? '件总量' : 'Total Units'}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                data-testid="mobile-quote-submit-btn"
                className="flex-1 min-h-[48px] px-5 bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 touch-manipulation cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting
                    ? locale === 'zh'
                      ? '提交询价中...'
                      : locale === 'ru'
                      ? 'Отправка...'
                      : 'Submitting RFQ...'
                    : locale === 'zh'
                    ? '提交官方询价单'
                    : locale === 'ru'
                    ? 'Отправить запрос (RFQ)'
                    : 'Submit Official RFQ'}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
