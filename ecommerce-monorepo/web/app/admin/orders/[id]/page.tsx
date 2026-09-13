'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Truck,
  Ship,
  Edit,
  Save,
  X,
  Loader2,
  DollarSign,
  TrendingUp,
  Download,
  FileDown,
  Printer,
  Clock,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'warning',
  PAID: 'success',
  PROCESSING: 'secondary',
  SHIPPED: 'default',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
  ON_HOLD: 'warning'
}

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { dict, locale, t } = useAdminLocale()
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'order' | 'shipping'>('order')
  
  // Order fields
  const [editedStatus, setEditedStatus] = useState('')
  const [editedTracking, setEditedTracking] = useState('')
  const [editedCarrier, setEditedCarrier] = useState('')
  const [editedNotes, setEditedNotes] = useState('')

  // Shipping fields
  const [carrierType, setCarrierType] = useState('COMPANY')
  const [customerCarrier, setCustomerCarrier] = useState('')
  const [customerCarrierTracking, setCustomerCarrierTracking] = useState('')
  const [customerCarrierContact, setCustomerCarrierContact] = useState('')
  const [customerCarrierNotes, setCustomerCarrierNotes] = useState('')
  const [companyCarrier, setCompanyCarrier] = useState('')
  const [companyTracking, setCompanyTracking] = useState('')
  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [containerId, setContainerId] = useState('')

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['admin-order', params.id],
    queryFn: () => api.get(`/api/admin/orders/${params.id}`),
  })

  const { data: containersData } = useQuery({
    queryKey: ['containers', 'available'],
    queryFn: () => api.get('/api/admin/containers?status=PLANNING,LOADING'),
    enabled: activeTab === 'shipping',
  })

  const order = orderData?.data

  // Sync local state when order loads
  useEffect(() => {
    if (order) {
      setEditedStatus(order.status)
      setEditedTracking(order.trackingNumber || '')
      setEditedCarrier(order.carrier || '')
      setEditedNotes(order.adminNotes || '')
      setCarrierType(order.carrierType || 'COMPANY')
      setCustomerCarrier(order.customerCarrier || '')
      setCustomerCarrierTracking(order.customerCarrierTracking || '')
      setCustomerCarrierContact(order.customerCarrierContact || '')
      setCustomerCarrierNotes(order.customerCarrierNotes || '')
      setCompanyCarrier(order.carrier || '')
      setCompanyTracking(order.trackingNumber || '')
      setEstimatedDelivery(order.estimatedDelivery ? order.estimatedDelivery.split('T')[0] : '')
      setContainerId(order.containerId || '')
    }
  }, [order])

  const updateOrderMutation = useMutation({
    mutationFn: (data: any) => api.put(`/api/admin/orders/${params.id}/shipping`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', params.id] })
      toast({ title: 'Shipping updated successfully!' })
    },
  })

  const assignContainerMutation = useMutation({
    mutationFn: (data: any) => api.post(`/api/admin/orders/${params.id}/container`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', params.id] })
      toast({ title: 'Order assigned to container!' })
    },
  })

  // 24-Hour Stock Reservation Mutation
  const reserveStockMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/orders/${params.id}/reserve`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error || 'Reservation failed')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', params.id] })
      toast({ title: data.message || 'Stock reserved for 24 hours!' })
    },
    onError: (err: any) => toast({ title: err.message, variant: 'destructive' }),
  })

  // Direct Container Sale Fulfillment Mutation (Flow 3)
  const directContainerSaleMutation = useMutation({
    mutationFn: async (contId: string) => {
      const res = await fetch(`/api/admin/orders/${params.id}/container`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerId: contId, isDirectSale: true }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Direct container assignment failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', params.id] })
      toast({ title: 'Direct B2B container assigned. Direct customs/delivery flow activated!' })
    },
    onError: (err: any) => toast({ title: err.message, variant: 'destructive' }),
  })

  const handleSaveOrder = async () => {
    if (!order) return
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editedStatus,
          trackingNumber: editedTracking,
          carrier: editedCarrier,
          adminNotes: editedNotes
        })
      })

      const data = await response.json()
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['admin-order', params.id] })
        setEditing(false)
        toast({ title: dict.common.updateSuccess })
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast({ title: dict.common.errorOccurred, variant: 'destructive' })
    }
  }

  const handleSaveShipping = () => {
    if (carrierType === 'CUSTOMER') {
      updateOrderMutation.mutate({
        carrierType: 'CUSTOMER',
        customerCarrier,
        customerCarrierTracking,
        customerCarrierContact,
        customerCarrierNotes,
      })
    } else {
      updateOrderMutation.mutate({
        carrierType: 'COMPANY',
        carrier: companyCarrier,
        trackingNumber: companyTracking,
        estimatedDelivery: estimatedDelivery || null,
      })
    }
  }

  const handleAssignContainer = () => {
    if (!containerId) return
    assignContainerMutation.mutate({ containerId })
  }

  const handleCancel = () => {
    if (order) {
      setEditedStatus(order.status)
      setEditedTracking(order.trackingNumber || '')
      setEditedCarrier(order.carrier || '')
      setEditedNotes(order.adminNotes || '')
    }
    setEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{dict.common.noData}</h2>
        <Button onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {dict.orders.title}
        </Button>
      </div>
    )
  }

  const isB2B = order.total > 1000

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {dict.common.back}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-gray-600">
              {dict.orders.orderDate} {new Date(order.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US')} {new Date(order.createdAt).toLocaleTimeString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.carrierType === 'CUSTOMER' && (
            <Badge className="bg-purple-100 text-purple-800">{dict.orders.customerCarrier}</Badge>
          )}
          {order.containerId && (
            <Badge className="bg-blue-100 text-blue-800">{dict.shipments.containerNumber}</Badge>
          )}
          {order.reservationExpiresAt && new Date(order.reservationExpiresAt) > new Date() && (
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 gap-1 text-[11px] font-mono">
              <Clock size={12} className="text-amber-700 animate-pulse" />
              Hold expires: {new Date(order.reservationExpiresAt).toLocaleTimeString()}
            </Badge>
          )}

          {order.paymentStatus !== 'PAID' && !order.reservationExpiresAt && (
            <Button
              variant="outline"
              size="sm"
              disabled={reserveStockMutation.isPending}
              onClick={() => reserveStockMutation.mutate()}
              className="rounded-xl gap-1 text-xs font-bold border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
            >
              <Clock size={13} className={reserveStockMutation.isPending ? 'animate-spin' : ''} />
              {reserveStockMutation.isPending ? 'Holding...' : 'Hold Stock (24h)'}
            </Button>
          )}

          <Badge variant={statusColors[order.status] || 'default'}>
            {t(order.status, order.status)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch(`/api/admin/orders/${params.id}/customs`, {
                  credentials: 'include',
                })
                if (!res.ok) throw new Error('Failed to generate PDF invoice')
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `invoice-${order.orderNumber}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast({ title: dict.orders.printInvoice || 'Invoice downloaded successfully' })
              } catch (err) {
                console.error('Invoice download error:', err)
                toast({ title: dict.common.errorOccurred || 'Failed to download invoice', variant: 'destructive' })
              }
            }}
            className="rounded-xl gap-1.5 text-xs font-semibold border-gray-200 hover:bg-gray-50 shadow-xs"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>{dict.orders.printInvoice || 'Download Invoice PDF'}</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('order')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'order'
              ? 'border-[#1a3a5c] text-[#1a3a5c]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4 inline mr-1" />
          {dict.orders.orderDetails}
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'shipping'
              ? 'border-[#1a3a5c] text-[#1a3a5c]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Truck className="w-4 h-4 inline mr-1" />
          {dict.orders.shippingFulfillment}
        </button>
      </div>

      {activeTab === 'order' ? (
        /* ======= ORDER DETAILS TAB ======= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {dict.orders.orderItems}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.product?.thumbnail ? (
                          <img 
                            src={item.product.thumbnail} 
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-600">{dict.products.sku}: {item.productSku}</p>
                        <p className="text-sm text-gray-600">{dict.wholesale.quantity}: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ${item.total.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{dict.orders.subtotal}</span>
                    <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{dict.orders.shipping}</span>
                    <span className="text-gray-900">${order.shippingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{dict.orders.tax}</span>
                    <span className="text-gray-900">${order.tax.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{dict.orders.discount}</span>
                      <span className="text-green-600">-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>{dict.orders.totalAmount}</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Ledger & Gross Profit Breakdown */}
            {(() => {
              // Calculate factory cost of goods (COGS)
              const purchaseCost = order.purchaseCost !== null && order.purchaseCost !== undefined
                ? Number(order.purchaseCost)
                : order.items.reduce((sum: number, it: any) => {
                    const cost = it.product?.costPrice ? Number(it.product.costPrice) * it.quantity : 0
                    return sum + cost
                  }, 0)

              // Gross Profit = Total (or Subtotal) - COGS - Shipping Cost
              const shippingExpense = Number(order.shippingCost || 0)
              const grossProfit = order.profit !== null && order.profit !== undefined
                ? Number(order.profit)
                : (order.subtotal - purchaseCost - shippingExpense)

              const marginPct = order.profitMargin !== null && order.profitMargin !== undefined
                ? Number(order.profitMargin)
                : (order.subtotal > 0 ? (grossProfit / order.subtotal) * 100 : 0)

              return (
                <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/20">
                  <CardHeader className="pb-3 border-b border-emerald-100/60">
                    <CardTitle className="flex items-center justify-between text-sm font-bold text-emerald-950">
                      <span className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        {dict.orders.financialLedger}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {order.currency || 'USD'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">{dict.orders.subtotal}</span>
                      <span className="font-mono font-semibold text-gray-900">${order.subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">{dict.orders.cogs}</span>
                      <span className="font-mono font-semibold text-gray-700">
                        {purchaseCost > 0 ? `-$${purchaseCost.toFixed(2)}` : '—'}
                      </span>
                    </div>

                    {shippingExpense > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Carrier Freight Cost</span>
                        <span className="font-mono font-semibold text-gray-700">-${shippingExpense.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-gray-900 block text-xs">{dict.orders.grossProfit}</span>
                        <span className="text-[10px] text-gray-400">{dict.orders.netProfitRate}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-black text-sm block ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          ${grossProfit.toFixed(2)}
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          marginPct >= 20
                            ? 'bg-emerald-100 text-emerald-800'
                            : marginPct >= 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <TrendingUp size={10} />
                          {marginPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Tracking History */}
            {order.trackingHistory && order.trackingHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{dict.orders.trackingHistory}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(order.trackingHistory as any[]).map((event: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                          {index < order.trackingHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{t(event.status, event.status)}</span>
                            <span className="text-sm text-gray-600">
                              {event.timestamp ? new Date(event.timestamp).toLocaleString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US') : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{event.note}</p>
                          {event.location && (
                            <p className="text-sm text-gray-500 mt-1">{event.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Status & Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  {dict.orders.orderStatus}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <Label>{dict.common.status}</Label>
                      <Select
                        value={editedStatus}
                        onValueChange={(value) => setEditedStatus(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={dict.common.status} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">{dict.status.PENDING}</SelectItem>
                          <SelectItem value="PAID">{dict.status.PAID}</SelectItem>
                          <SelectItem value="PROCESSING">{dict.status.PROCESSING}</SelectItem>
                          <SelectItem value="PICKING">{dict.status.PICKING}</SelectItem>
                          <SelectItem value="PACKING">{dict.status.PACKING}</SelectItem>
                          <SelectItem value="SHIPPED">{dict.status.SHIPPED}</SelectItem>
                          <SelectItem value="IN_TRANSIT">{dict.status.IN_TRANSIT}</SelectItem>
                          <SelectItem value="CUSTOMS_HOLD">{dict.status.CUSTOMS_HOLD}</SelectItem>
                          <SelectItem value="CUSTOMS_CLEARED">{dict.status.CUSTOMS_CLEARED}</SelectItem>
                          <SelectItem value="DELIVERED">{dict.status.DELIVERED}</SelectItem>
                          <SelectItem value="ON_HOLD">{dict.status.ON_HOLD}</SelectItem>
                          <SelectItem value="CANCELLED">{dict.status.CANCELLED}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{dict.shipments.carrier}</Label>
                      <Input
                        value={editedCarrier}
                        onChange={(e) => setEditedCarrier(e.target.value)}
                        placeholder="e.g., DHL, FedEx, China Post"
                      />
                    </div>
                    <div>
                      <Label>{dict.orders.trackingNumber}</Label>
                      <Input
                        value={editedTracking}
                        onChange={(e) => setEditedTracking(e.target.value)}
                        placeholder="Tracking number"
                      />
                    </div>
                    <div>
                      <Label>{dict.returns.adminNotes}</Label>
                      <Textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder={dict.returns.adminNotes}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveOrder} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        {dict.common.save}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{dict.common.status}</span>
                      <Badge variant={statusColors[order.status] || 'default'}>
                        {t(order.status, order.status)}
                      </Badge>
                    </div>
                    {order.carrier && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{dict.shipments.carrier}</span>
                        <span className="font-medium text-gray-900">{order.carrier}</span>
                      </div>
                    )}
                    {order.trackingNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{dict.orders.trackingNumber}</span>
                        <span className="font-mono text-sm">{order.trackingNumber}</span>
                      </div>
                    )}
                    {order.estimatedDelivery && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{dict.shipments.estimatedDelivery}</span>
                        <span className="text-sm">
                          {new Date(order.estimatedDelivery).toLocaleDateString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US')}
                        </span>
                      </div>
                    )}
                    {order.adminNotes && (
                      <div className="pt-2 border-t">
                        <span className="text-sm text-gray-600">{dict.returns.adminNotes}:</span>
                        <p className="text-sm text-gray-900 mt-1">{order.adminNotes}</p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setEditing(true)}
                      className="w-full mt-2"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {dict.common.edit}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {dict.orders.customerDetails}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {order.user?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || dict.common.noData}
                  </h4>
                  <p className="text-sm text-gray-600">{order.user?.email}</p>
                  {order.user?.phone && (
                    <p className="text-sm text-gray-600">{order.user.phone}</p>
                  )}
                  {order.user?.companyName && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{dict.wholesale.companyName}:</span> {order.user.companyName}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {dict.orders.shippingAddress}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">
                  {order.shippingAddress?.fullName || order.user?.name}
                </p>
                <p>{order.shippingAddress?.addressLine1 || order.shippingAddress?.address}</p>
                {order.shippingAddress?.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postalCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <p>{order.shippingCountry?.name || dict.common.noData}</p>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {dict.orders.paymentStatus}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">{dict.countries.paymentMethods}</span>
                  <p className="font-medium">{order.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">{dict.common.status}</span>
                  <div className="mt-1">
                    <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                      {t(order.paymentStatus, order.paymentStatus)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ======= SHIPPING & FULFILLMENT TAB ======= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Current Shipping Status */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  {dict.orders.currentShippingStatus}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.carrierType === 'CUSTOMER' ? (
                  <div className="space-y-3">
                    <Badge className="bg-purple-100 text-purple-800">{dict.orders.customerCarrier}</Badge>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">{dict.shipments.carrier}</p>
                        <p className="font-medium">{order.customerCarrier || dict.common.noData}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{dict.orders.trackingNumber}</p>
                        <p className="font-medium">{order.customerCarrierTracking || dict.common.noData}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{dict.wholesale.contactPerson}</p>
                        <p className="font-medium">{order.customerCarrierContact || dict.common.noData}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{dict.shipments.notes}</p>
                        <p className="font-medium">{order.customerCarrierNotes || dict.common.noData}</p>
                      </div>
                    </div>
                  </div>
                ) : order.containerId ? (
                  <div className="space-y-3">
                    <Badge className="bg-blue-100 text-blue-800">{dict.shipments.containerNumber}</Badge>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">{dict.shipments.containerNumber}</p>
                        <p className="font-medium font-mono">{order.containerNumber}</p>
                      </div>
                      {order.carrier && (
                        <div>
                          <p className="text-gray-500">{dict.shipments.carrier}</p>
                          <p className="font-medium">{order.carrier}</p>
                        </div>
                      )}
                    </div>
                    <Link href={`/admin/containers/${order.containerId}`}>
                      <Button variant="outline" size="sm">
                        <Ship className="w-4 h-4 mr-1" />
                        {dict.orders.viewContainerDetails}
                      </Button>
                    </Link>
                  </div>
                ) : order.trackingNumber ? (
                  <div className="space-y-3">
                    <Badge className="bg-green-100 text-green-800">{dict.status.SHIPPED}</Badge>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">{dict.shipments.carrier}</p>
                        <p className="font-medium">{order.carrier || dict.common.noData}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{dict.orders.trackingNumber}</p>
                        <p className="font-medium font-mono">{order.trackingNumber}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Package className="w-16 h-16 mx-auto text-gray-200 mb-3" />
                    <p className="font-medium text-gray-500">{dict.common.noData}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right - Update Shipping + Container */}
          <div className="space-y-6">
            {/* Update Shipping Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{dict.orders.updateShipping}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label>{dict.orders.shippingType}</Label>
                    <Select
                      value={carrierType}
                      onValueChange={setCarrierType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={dict.orders.shippingType} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPANY">{dict.orders.companyShipping}</SelectItem>
                        <SelectItem value="CUSTOMER">{dict.orders.customerCarrier}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {carrierType === 'COMPANY' && (
                    <>
                      <div>
                        <Label>{dict.shipments.carrier}</Label>
                        <Select value={companyCarrier} onValueChange={setCompanyCarrier}>
                          <SelectTrigger>
                            <SelectValue placeholder={dict.shipments.carrier} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DHL">DHL Express</SelectItem>
                            <SelectItem value="FedEx">FedEx</SelectItem>
                            <SelectItem value="EMS">EMS China Post</SelectItem>
                            <SelectItem value="SeaFreight">Sea Freight</SelectItem>
                            <SelectItem value="Truck">Truck Transport</SelectItem>
                            <SelectItem value="Train">Rail Freight</SelectItem>
                            <SelectItem value="Air">Air Freight</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{dict.orders.trackingNumber}</Label>
                        <Input
                          value={companyTracking}
                          onChange={(e) => setCompanyTracking(e.target.value)}
                          placeholder={dict.orders.trackingNumber}
                        />
                      </div>
                      <div>
                        <Label>{dict.shipments.estimatedDelivery}</Label>
                        <Input
                          type="date"
                          value={estimatedDelivery}
                          onChange={(e) => setEstimatedDelivery(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {carrierType === 'CUSTOMER' && (
                    <>
                      <div>
                        <Label>{dict.orders.customerCarrier} *</Label>
                        <Input
                          value={customerCarrier}
                          onChange={(e) => setCustomerCarrier(e.target.value)}
                          placeholder="e.g., Customer's Freight Forwarder"
                        />
                      </div>
                      <div>
                        <Label>{dict.orders.trackingNumber}</Label>
                        <Input
                          value={customerCarrierTracking}
                          onChange={(e) => setCustomerCarrierTracking(e.target.value)}
                          placeholder={dict.orders.trackingNumber}
                        />
                      </div>
                      <div>
                        <Label>{dict.wholesale.contactPerson}</Label>
                        <Input
                          value={customerCarrierContact}
                          onChange={(e) => setCustomerCarrierContact(e.target.value)}
                          placeholder="Phone or email"
                        />
                      </div>
                      <div>
                        <Label>{dict.shipments.notes}</Label>
                        <Input
                          value={customerCarrierNotes}
                          onChange={(e) => setCustomerCarrierNotes(e.target.value)}
                          placeholder={dict.shipments.notes}
                        />
                      </div>
                    </>
                  )}

                  <Button
                    onClick={handleSaveShipping}
                    disabled={updateOrderMutation.isPending}
                    className="w-full bg-[#1a3a5c] hover:bg-[#2a5a8c]"
                  >
                    {updateOrderMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {dict.wholesale.updating}
                      </>
                    ) : (
                      dict.orders.updateShipping
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Container Assignment (B2B only) */}
            {isB2B && !order.containerId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ship className="w-4 h-4" />
                    {dict.orders.assignToContainer}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label>{dict.orders.selectContainer}</Label>
                      <Select
                        value={containerId}
                        onValueChange={setContainerId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={dict.orders.selectContainer} />
                        </SelectTrigger>
                        <SelectContent>
                          {containersData?.data?.map((container: any) => (
                            <SelectItem key={container.id} value={container.id}>
                              {container.containerNumber} - {container.status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-2 space-y-2">
                      <Button
                        onClick={handleAssignContainer}
                        disabled={assignContainerMutation.isPending || !containerId}
                        className="w-full bg-[#1a3a5c] hover:bg-[#2a5a8c]"
                      >
                        {assignContainerMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {dict.wholesale.updating}
                          </>
                        ) : (
                          dict.orders.assignToContainer
                        )}
                      </Button>

                      <Button
                        onClick={() => {
                          if (confirm('Enable Direct Container Sale (Flow 3)? This bypasses the Belarus DC warehouse entirely; customs clearance and delivery will occur directly to the customer.')) {
                            directContainerSaleMutation.mutate(containerId)
                          }
                        }}
                        disabled={directContainerSaleMutation.isPending || !containerId}
                        variant="outline"
                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold"
                      >
                        {directContainerSaleMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Setting Direct Delivery...
                          </>
                        ) : (
                          <>
                            <Truck className="w-3.5 h-3.5 mr-1 text-blue-600" /> Direct Container Sale (Flow 3)
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show container link if already assigned */}
            {order.containerId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ship className="w-4 h-4" />
                    {dict.shipments.containerNumber}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium font-mono mb-3">{order.containerNumber}</p>
                  <Link href={`/admin/containers/${order.containerId}`}>
                    <Button variant="outline" className="w-full">
                      <Ship className="w-4 h-4 mr-2" />
                      {dict.orders.viewContainerDetails}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
