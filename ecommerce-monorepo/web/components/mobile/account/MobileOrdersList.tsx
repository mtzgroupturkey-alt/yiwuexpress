'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { 
  Package, 
  Search, 
  ChevronRight, 
  Clock, 
  Calendar, 
  MapPin, 
  ArrowRight,
  Filter,
  AlertCircle
} from 'lucide-react'
import { MobileHeader } from '../MobileHeader'
import { EmptyState } from '../EmptyState'
import { useCurrency } from '@/hooks/useCurrency'

export interface MobileOrderData {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: Array<any>
  shippingCountry?: {
    name: string
    flag: string
  }
}

interface MobileOrdersListProps {
  orders: MobileOrderData[]
  onSelectOrder?: (orderId: string) => void
  isLoading?: boolean
  error?: string | null
  statusFilter?: string
  onStatusFilterChange?: (status: string) => void
  searchQuery?: string
  onSearchChange?: (q: string) => void
  onBack?: () => void
  className?: string
}

export function MobileOrdersList({
  orders,
  onSelectOrder,
  isLoading = false,
  error = null,
  statusFilter = '',
  onStatusFilterChange,
  searchQuery = '',
  onSearchChange,
  onBack,
  className = '',
}: MobileOrdersListProps) {
  const router = useRouter()
  const locale = useLocale()
  const { formatPrice } = useCurrency()

  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [localStatus, setLocalStatus] = useState(statusFilter)

  const handleSearch = (val: string) => {
    setLocalSearch(val)
    if (onSearchChange) onSearchChange(val)
  }

  const handleStatusChange = (val: string) => {
    setLocalStatus(val)
    if (onStatusFilterChange) onStatusFilterChange(val)
  }

  const handleOrderClick = (id: string) => {
    if (onSelectOrder) {
      onSelectOrder(id)
    } else {
      router.push(`/${locale}/orders/${id}`)
    }
  }

  const statusTabs = [
    { id: '', label: locale === 'zh' ? '全部订单' : locale === 'ru' ? 'Все' : 'All' },
    { id: 'PENDING', label: locale === 'zh' ? '待付款' : locale === 'ru' ? 'Ожидает' : 'Pending' },
    { id: 'PAID', label: locale === 'zh' ? '已支付' : locale === 'ru' ? 'Оплачен' : 'Paid' },
    { id: 'PROCESSING', label: locale === 'zh' ? '处理中' : locale === 'ru' ? 'В обработке' : 'Processing' },
    { id: 'SHIPPED', label: locale === 'zh' ? '已发货' : locale === 'ru' ? 'В пути' : 'Shipped' },
    { id: 'DELIVERED', label: locale === 'zh' ? '已签收' : locale === 'ru' ? 'Доставлен' : 'Delivered' },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'PAID':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      case 'SHIPPED':
      case 'PROCESSING':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      case 'PENDING':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      case 'CANCELLED':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
      default:
        return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
    }
  }

  // Client-side filtering when not controlled externally
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = !localStatus || o.status === localStatus
    const matchesSearch = !localSearch.trim() || o.orderNumber.toLowerCase().includes(localSearch.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div
      data-testid="mobile-orders-list"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] pt-[calc(56px+env(safe-area-inset-top,0px))] pb-24 ${className}`}
    >
      {/* 1. Header */}
      <MobileHeader
        showBack={true}
        onBack={onBack || (() => router.push(`/${locale}`))}
        title={locale === 'zh' ? '我的订单' : locale === 'ru' ? 'Мои заказы' : 'My Orders'}
        showSearchToggle={false}
      />

      {/* 2. Status Tabs Horizontal Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3.5 py-2.5 bg-white dark:bg-[#0f172a] border-b border-gray-200/80 dark:border-slate-800 sticky top-14 z-20">
        {statusTabs.map((tab) => {
          const isSelected = localStatus === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleStatusChange(tab.id)}
              className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 touch-manipulation shrink-0 border ${
                isSelected
                  ? 'bg-[#00407a] dark:bg-primary-600 border-[#00407a] dark:border-primary-600 text-white shadow-xs'
                  : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 3. Search Bar */}
      <div className="px-3.5 pt-3">
        <div className="relative">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={
              locale === 'zh' ? '按订单号搜索...' : locale === 'ru' ? 'Поиск по номеру заказа...' : 'Search by order number...'
            }
            className="w-full h-10 pl-9 pr-3 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* 4. Orders List Body */}
      <div className="p-3.5 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 space-y-3 animate-pulse shadow-2xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-full w-16" />
              </div>
              <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-between">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/4" />
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/4" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title={locale === 'zh' ? '暂无订单记录' : locale === 'ru' ? 'Заказы не найдены' : 'No Orders Found'}
            description={
              locale === 'zh'
                ? '您还没有提交任何订单，或当前筛选条件下无匹配项'
                : locale === 'ru'
                ? 'Вы еще не оформили заказов или нет совпадений'
                : "You haven't placed any orders matching this filter."
            }
            actionLabel={locale === 'zh' ? '前往商城选购' : locale === 'ru' ? 'В каталог' : 'Explore Store'}
            onAction={() => router.push(`/${locale}/store`)}
          />
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order.id)}
              className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3 cursor-pointer active:scale-98 transition-transform touch-manipulation"
            >
              {/* Top: Order number & status badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                    {order.orderNumber}
                  </span>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              </div>

              {/* Middle: Details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-slate-400 py-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <span>
                    {order.items.length} {locale === 'zh' ? '件商品' : locale === 'ru' ? 'тов.' : 'items'}
                  </span>
                </div>
                {order.shippingCountry && (
                  <div className="flex items-center gap-1.5 col-span-2 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      {order.shippingCountry.flag} {order.shippingCountry.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom: Total & CTA (>=48px tap container) */}
              <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-[11px] text-gray-400">{locale === 'zh' ? '总计' : locale === 'ru' ? 'Итого' : 'Total'}:</span>
                  <span className="text-sm font-black text-[#00407a] dark:text-[#F5A602]">
                    {formatPrice(order.total)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400">
                  <span>{locale === 'zh' ? '订单详情' : locale === 'ru' ? 'Подробнее' : 'Details'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
