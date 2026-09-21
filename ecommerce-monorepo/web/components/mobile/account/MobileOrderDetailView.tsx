'use client'

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { 
  Package, 
  MapPin, 
  CreditCard, 
  Truck, 
  Check, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react'
import { MobileHeader } from '../MobileHeader'
import { useCurrency } from '@/hooks/useCurrency'

export interface OrderItemDetail {
  id: string
  productName: string
  productSku?: string
  productImage?: string
  quantity: number
  price: number
  total: number
}

export interface OrderDetailData {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string
  total: number
  subtotal: number
  shippingFee: number
  tax: number
  discount: number
  createdAt: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  shippingCity: string
  shippingState?: string
  shippingPostalCode: string
  trackingNumber?: string
  carrier?: string
  trackingHistory?: any[]
  items: OrderItemDetail[]
  shippingCountry?: {
    name: string
    flag: string
    code?: string
  }
}

interface MobileOrderDetailViewProps {
  order: OrderDetailData | null
  isLoading?: boolean
  error?: string | null
  onBack?: () => void
  className?: string
}

export function MobileOrderDetailView({
  order,
  isLoading = false,
  error = null,
  onBack,
  className = '',
}: MobileOrderDetailViewProps) {
  const router = useRouter()
  const locale = useLocale()
  const { formatPrice } = useCurrency()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push(`/${locale}/orders`)
    }
  }

  const milestones = [
    { key: 'PENDING', label: locale === 'zh' ? '订单创建' : locale === 'ru' ? 'Создан' : 'Placed' },
    { key: 'PAID', label: locale === 'zh' ? '付款成功' : locale === 'ru' ? 'Оплачен' : 'Paid' },
    { key: 'PROCESSING', label: locale === 'zh' ? '备货出库' : locale === 'ru' ? 'Сборка' : 'Processing' },
    { key: 'SHIPPED', label: locale === 'zh' ? '在途转运' : locale === 'ru' ? 'В пути' : 'Shipped' },
    { key: 'DELIVERED', label: locale === 'zh' ? '已签收' : locale === 'ru' ? 'Доставлен' : 'Delivered' },
  ]

  const getMilestoneIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 0
      case 'PAID': return 1
      case 'PROCESSING': return 2
      case 'SHIPPED': return 3
      case 'DELIVERED': return 4
      case 'CANCELLED': return -1
      default: return 0
    }
  }

  const activeMilestoneIdx = order ? getMilestoneIndex(order.status) : 0

  return (
    <div
      data-testid="mobile-order-detail-view"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] pb-24 ${className}`}
    >
      {/* 1. Header */}
      <MobileHeader
        showBack={true}
        onBack={handleBack}
        title={locale === 'zh' ? '订单详细信息' : locale === 'ru' ? 'Детали заказа' : 'Order Details'}
        showSearchToggle={false}
      />

      {/* 2. Content */}
      <div className="p-3.5 space-y-3.5">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-32 bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-gray-100 dark:border-slate-800" />
            <div className="h-44 bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-gray-100 dark:border-slate-800" />
            <div className="h-40 bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-gray-100 dark:border-slate-800" />
          </div>
        ) : error || !order ? (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error || 'Order not found'}</span>
          </div>
        ) : (
          <>
            {/* Status Header Banner */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                    {locale === 'zh' ? '订单流水号' : locale === 'ru' ? 'Номер заказа' : 'Order Number'}
                  </span>
                  <span className="font-mono text-sm font-black text-gray-900 dark:text-white">
                    {order.orderNumber}
                  </span>
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                  {order.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-800">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>

              {/* Milestone Progress Bar */}
              {activeMilestoneIdx >= 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-3 w-full h-0.5 bg-gray-200 dark:bg-slate-700 -z-0" />
                    <div 
                      className="absolute left-0 top-3 h-0.5 bg-emerald-500 -z-0 transition-all duration-300"
                      style={{ width: `${(activeMilestoneIdx / (milestones.length - 1)) * 100}%` }}
                    />
                    {milestones.map((ms, idx) => {
                      const isDone = idx <= activeMilestoneIdx
                      const isCurrent = idx === activeMilestoneIdx

                      return (
                        <div key={ms.key} className="flex flex-col items-center z-10">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400'
                            } ${isCurrent ? 'ring-2 ring-emerald-400/40 ring-offset-1' : ''}`}
                          >
                            {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                          </div>
                          <span className={`text-[9px] mt-1 font-semibold whitespace-nowrap ${isCurrent ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-gray-400 dark:text-slate-500'}`}>
                            {ms.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Carrier & Tracking Card (if trackingNumber present) */}
            {order.trackingNumber && (
              <div className="bg-gradient-to-br from-[#0B192C] to-[#00407a] text-white rounded-2xl p-4 shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Truck className="w-4 h-4" />
                    <span>{order.carrier || 'International Express Freight'}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-300">
                    {order.trackingNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/track?num=${encodeURIComponent(order.trackingNumber!)}`)}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform"
                >
                  <span>{locale === 'zh' ? '在途物流轨迹实时跟踪' : locale === 'ru' ? 'Отследить доставку' : 'Live Cargo Tracking'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Purchased Items List */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                {locale === 'zh' ? '订单商品明细' : locale === 'ru' ? 'Товары в заказе' : 'Order Items'} ({order.items.length})
              </h3>

              <div className="space-y-3 divide-y divide-gray-100 dark:divide-slate-800">
                {order.items.map((item) => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0 overflow-hidden relative border border-gray-200/60 dark:border-slate-700 flex items-center justify-center">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {item.productName}
                      </h4>
                      {item.productSku && (
                        <span className="text-[10px] text-gray-400 font-mono block">
                          SKU: {item.productSku}
                        </span>
                      )}
                      <div className="flex justify-between items-baseline mt-1">
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {formatPrice(item.price)} × {item.quantity}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {formatPrice(item.total || item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-2 text-xs">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                {locale === 'zh' ? '费用明细' : locale === 'ru' ? 'Расчет стоимости' : 'Payment Summary'}
              </h3>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>{locale === 'zh' ? '商品小计' : locale === 'ru' ? 'Сумма' : 'Subtotal'}</span>
                <span>{formatPrice(order.subtotal || order.total)}</span>
              </div>
              {order.shippingFee > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>{locale === 'zh' ? '跨境运费' : locale === 'ru' ? 'Доставка' : 'Shipping Fee'}</span>
                  <span>{formatPrice(order.shippingFee)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>{locale === 'zh' ? '税费' : locale === 'ru' ? 'Налоги' : 'Tax'}</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>{locale === 'zh' ? '折扣优惠' : locale === 'ru' ? 'Скидка' : 'Discount'}</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-gray-100 dark:border-slate-800 font-bold text-sm">
                <span className="text-gray-900 dark:text-white">{locale === 'zh' ? '实付总额' : locale === 'ru' ? 'Итого' : 'Total Amount'}</span>
                <span className="text-base font-black text-[#00407a] dark:text-[#F5A602]">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>

            {/* Shipping & Destination Address */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center gap-2 text-primary-600 font-bold">
                <MapPin className="w-4 h-4" />
                <span>{locale === 'zh' ? '收货人及国际收货地址' : locale === 'ru' ? 'Адрес доставки' : 'Shipping Address'}</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-white pt-1">
                {order.customerName}
                {order.customerPhone && <span className="font-normal text-gray-500 ml-2">({order.customerPhone})</span>}
              </p>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                {order.shippingAddress}, {order.shippingCity}
                {order.shippingState ? `, ${order.shippingState}` : ''} {order.shippingPostalCode}
              </p>
              {order.shippingCountry && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold">
                  <span>{order.shippingCountry.flag}</span>
                  <span>{order.shippingCountry.name}</span>
                </div>
              )}
            </div>

            {/* Payment Method Details */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center gap-2 text-primary-600 font-bold">
                <CreditCard className="w-4 h-4" />
                <span>{locale === 'zh' ? '支付方式' : locale === 'ru' ? 'Способ оплаты' : 'Payment Method'}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-gray-700 dark:text-slate-300">
                <span className="font-medium capitalize">{order.paymentMethod || 'Credit Card / Escrow'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {order.paymentStatus || 'PAID'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
