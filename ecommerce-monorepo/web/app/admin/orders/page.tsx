'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search, Eye, Download, Package, ShoppingCart, DollarSign,
  Clock, Truck, CheckCircle2, AlertCircle, RefreshCw, Filter,
  ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, CreditCard
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number
  createdAt: string
  customerName: string
  customerEmail: string
  items: any[]
  user?: {
    id: string
    email: string
    name: string
  }
  shippingCountry?: {
    name: string
    flag: string
  }
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200/80',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    PROCESSING: 'bg-purple-50 text-purple-700 border-purple-200/80',
    PICKING: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    PACKING: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    SHIPPED: 'bg-blue-50 text-blue-700 border-blue-200/80',
    IN_TRANSIT: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
    CUSTOMS_HOLD: 'bg-orange-50 text-orange-700 border-orange-200/80',
    CUSTOMS_CLEARED: 'bg-teal-50 text-teal-700 border-teal-200/80',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-200/80',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200/80',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      {status}
    </span>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const isPaid = status === 'PAID'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
      isPaid
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
        : 'bg-amber-50 text-amber-700 border-amber-200/80'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {status || 'UNPAID'}
    </span>
  )
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, search, statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/orders')
      const data = await response.json()

      if (data.success) {
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.customerEmail.toLowerCase().includes(searchLower)
      )
    }

    setFilteredOrders(filtered)
    setPage(1)
  }

  const exportCSV = () => {
    if (orders.length === 0) return
    const headers = ['Order Number', 'Customer Name', 'Customer Email', 'Status', 'Payment Status', 'Total', 'Date']
    const rows = orders.map(o => [
      o.orderNumber,
      `"${o.customerName || ''}"`,
      o.customerEmail || '',
      o.status,
      o.paymentStatus,
      o.total,
      new Date(o.createdAt).toISOString()
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const displayOrders = filteredOrders.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(filteredOrders.length / limit)

  // Metrics
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  const pendingCount = orders.filter(o => o.status === 'PENDING').length
  const processingCount = orders.filter(o => ['PROCESSING', 'PICKING', 'PACKING', 'SHIPPED', 'IN_TRANSIT'].includes(o.status)).length
  const completedCount = orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Orders Management</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#1a3a5c]/10 text-[#1a3a5c] rounded-full">
              {orders.length} total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track customer purchases, fulfillment stages, payment confirmations, and shipment statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={fetchOrders}
            className="rounded-xl text-xs font-semibold h-10 px-3.5 border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1.5"
            title="Refresh order records"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={exportCSV}
            disabled={orders.length === 0}
            className="bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] hover:from-[#152e4a] hover:to-[#1d4ed8] text-white shadow-md shadow-blue-900/10 rounded-xl px-4 py-2.5 font-bold text-xs inline-flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign size={19} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Paid Volume</p>
            <p className="text-lg font-black text-gray-900">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={19} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pending Orders</p>
            <p className="text-lg font-black text-amber-600">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck size={19} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">In Fulfillment</p>
            <p className="text-lg font-black text-blue-600">{processingCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={19} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Completed Orders</p>
            <p className="text-lg font-black text-teal-600">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Station & Status Tabs */}
      <div className="space-y-3">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { key: '', label: 'All Orders', count: orders.length },
            { key: 'PENDING', label: 'Pending', count: pendingCount },
            { key: 'PROCESSING', label: 'Processing', count: orders.filter(o => o.status === 'PROCESSING').length },
            { key: 'SHIPPED', label: 'Shipped', count: orders.filter(o => o.status === 'SHIPPED').length },
            { key: 'DELIVERED', label: 'Delivered', count: completedCount },
            { key: 'CANCELLED', label: 'Cancelled', count: orders.filter(o => o.status === 'CANCELLED').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-[#1a3a5c] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/70'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by order number (e.g. ORD-123), customer name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(search || statusFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('')
                }}
                className="h-10 px-4 rounded-xl text-xs font-semibold text-gray-600 border-gray-200 hover:bg-gray-50 shrink-0"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table & Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin border-t-[#1a3a5c]"></div>
          <p className="text-xs font-medium text-gray-500 mt-3">Loading order registry...</p>
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <ShoppingCart size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No orders found</h3>
          <p className="text-xs text-gray-500 mb-5 max-w-sm mx-auto">
            {search || statusFilter ? 'No orders match your search criteria.' : 'No customer orders have been placed in the store yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Order Reference</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Date Placed</th>
                    <th className="py-3.5 px-4">Fulfillment Status</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Order Total</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {displayOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Order Info */}
                      <td className="py-4 px-5">
                        <div>
                          <p className="font-mono font-bold text-gray-900 text-sm group-hover:text-[#1a3a5c] transition-colors">
                            {order.orderNumber}
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {order.items?.length || 0} line items
                          </p>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {((order.customerName || order.user?.name || order.customerEmail || 'C')[0]).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {order.customerName || order.user?.name || 'Guest Customer'}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {order.customerEmail || order.user?.email || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="text-gray-900 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>

                      {/* Fulfillment Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      {/* Payment Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>

                      {/* Total */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900 text-sm font-mono">
                          ${Number(order.total).toFixed(2)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="h-8 px-3 rounded-xl text-xs font-semibold text-[#1a3a5c] border-gray-200 hover:bg-[#1a3a5c] hover:text-white hover:border-[#1a3a5c] transition-all"
                        >
                          <Eye size={14} className="mr-1.5" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden space-y-3.5">
            {displayOrders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono font-bold text-gray-900 text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{order.customerName || order.user?.name}</p>
                    <p className="text-[11px] text-gray-400">{order.customerEmail}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Placed On</span>
                    <span className="font-medium text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Payment</span>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Line Items</span>
                    <span className="font-medium text-gray-800">{order.items?.length || 0} items</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Total Amount</span>
                    <span className="font-bold text-gray-900 text-sm">${Number(order.total).toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="w-full bg-[#1a3a5c] text-white text-xs font-bold rounded-xl py-2.5"
                >
                  <Eye size={14} className="mr-1.5" />
                  View Order Details
                </Button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
              <p className="text-xs text-gray-500 font-medium">
                Showing page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages}</span> ({filteredOrders.length} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl text-xs font-semibold"
                >
                  <ChevronLeft size={14} className="mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl text-xs font-semibold"
                >
                  Next
                  <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

