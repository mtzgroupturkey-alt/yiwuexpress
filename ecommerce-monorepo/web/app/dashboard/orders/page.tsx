'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Package, Search, Eye, Clock, ChevronRight, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/design-system/Container'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product?: {
    name: string
    images?: string[]
    thumbnail?: string | null
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount?: number
  total?: number
  createdAt: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, isInitialized } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const t = useTranslations('DashboardPages')
  const to = useTranslations('DashboardPages.orders')

  useEffect(() => {
    if (isInitialized && !authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/orders')
    }
  }, [isInitialized, authLoading, isAuthenticated, router])

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', 'user'],
    queryFn: () => api.get('/api/orders'),
    enabled: !!user,
  })

  const orders: Order[] = ordersData?.data || []

  // Status counts for filter pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length }
    for (const o of orders) {
      const s = (o.status || '').toUpperCase()
      counts[s] = (counts[s] || 0) + 1
    }
    return counts
  }, [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchTerm ||
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'ALL' || (order.status || '').toUpperCase() === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, searchTerm, statusFilter])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      PAID: { bg: 'bg-blue-50', text: 'text-[#00407a]', border: 'border-blue-200' },
      PROCESSING: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
      SHIPPED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    }
    const s = styles[status] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
    return (
      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${s.bg} ${s.text} ${s.border}`}>
        {status}
      </span>
    )
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#00407a' }}></div>
          <p className="text-xs text-slate-500 font-medium">{t('loadingOrders')}</p>
        </div>
      </div>
    )
  }

  return (
    <Container className="py-6 sm:py-8 space-y-6">
      {/* Standard Clean Action Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { key: 'ALL', label: to('allOrders') },
            { key: 'PROCESSING', label: to('processing') },
            { key: 'PENDING', label: to('pending') },
            { key: 'SHIPPED', label: to('shipped') },
            { key: 'DELIVERED', label: to('delivered') },
          ].map((pill) => {
            const count = statusCounts[pill.key] || 0
            const isActive = statusFilter === pill.key
            return (
              <button
                key={pill.key}
                onClick={() => setStatusFilter(pill.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#00407a] text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span>{pill.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Right: Search Box */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={to('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
          />
        </div>
      </div>

      {/* Orders List */}
      <div>
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">{to('noOrders')}</h3>
            <p className="text-xs text-slate-500 mb-5 max-w-sm">{to('noOrdersDesc')}</p>
            <Link
              href="/store"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {to('browseProducts')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredOrders.map((order) => {
              const amount = order.totalAmount ?? order.total ?? 0
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0 font-bold">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-sm text-slate-900">
                            {to('orderLabel', { number: order.orderNumber || order.id.slice(0, 8) })}
                          </p>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400">{to('totalAmount')}</p>
                      <p className="font-black text-base text-slate-900">${amount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">
                      {to('itemsIncludedCount', { count: order.items?.length || 0 })}
                    </span>

                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1 font-bold text-[#00407a] hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{to('viewDetails')}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Container>
  )
}