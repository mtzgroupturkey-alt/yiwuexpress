'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Truck,
  Edit,
  Save,
  X
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string
  subtotal: number
  shippingFee: number
  tax: number
  discount: number
  total: number
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
  adminNotes?: string
  shippingCountry?: {
    name: string
    code: string
  }
  user: {
    id: string
    name: string
    email: string
    phone?: string
  }
  items: Array<{
    id: string
    productName: string
    productSku: string
    productImage?: string
    quantity: number
    price: number
    total: number
    product: {
      id: string
      name: string
      thumbnail?: string
      sku: string
    }
  }>
  trackingHistory: Array<{
    status: string
    notes: string
    timestamp: string
    location: string
  }>
}

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
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [editedStatus, setEditedStatus] = useState('')
  const [editedTracking, setEditedTracking] = useState('')
  const [editedCarrier, setEditedCarrier] = useState('')
  const [editedNotes, setEditedNotes] = useState('')

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setOrder(data.data)
        setEditedStatus(data.data.status)
        setEditedTracking(data.data.trackingNumber || '')
        setEditedCarrier(data.data.carrier || '')
        setEditedNotes(data.data.adminNotes || '')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!order) return

    setSaving(true)
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
        setOrder(data.data)
        setEditing(false)
      }
    } catch (error) {
      console.error('Error updating order:', error)
    } finally {
      setSaving(false)
    }
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <Button onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-gray-600">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
              {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Order
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.product.thumbnail ? (
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
                      <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ${item.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        ${item.price.toFixed(2)} each
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">${order.shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${order.tax.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking History */}
          {order.trackingHistory && order.trackingHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tracking History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.trackingHistory.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        {index < order.trackingHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{event.status}</span>
                          <span className="text-sm text-gray-600">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{event.notes}</p>
                        {event.location && (
                          <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
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
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <Select
                      value={editedStatus}
                      onValueChange={(value) => setEditedStatus(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="PICKING">Picking</SelectItem>
                        <SelectItem value="PACKING">Packing</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                        <SelectItem value="CUSTOMS_HOLD">Customs Hold</SelectItem>
                        <SelectItem value="CUSTOMS_CLEARED">Customs Cleared</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Carrier</label>
                    <Input
                      value={editedCarrier}
                      onChange={(e) => setEditedCarrier(e.target.value)}
                      placeholder="e.g., DHL, FedEx, China Post"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tracking Number</label>
                    <Input
                      value={editedTracking}
                      onChange={(e) => setEditedTracking(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Admin Notes</label>
                    <Textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Internal notes about this order"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={saving}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-sm text-gray-600">Status</span>
                    <div className="mt-1">
                      <Badge variant={statusColors[order.status] || 'default'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  {order.carrier && (
                    <div>
                      <span className="text-sm text-gray-600">Carrier</span>
                      <p className="font-medium">{order.carrier}</p>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div>
                      <span className="text-sm text-gray-600">Tracking Number</span>
                      <p className="font-medium font-mono text-sm">{order.trackingNumber}</p>
                    </div>
                  )}
                  {order.adminNotes && (
                    <div>
                      <span className="text-sm text-gray-600">Admin Notes</span>
                      <p className="text-sm mt-1">{order.adminNotes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Name</span>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email</span>
                <p className="font-medium text-sm">{order.customerEmail}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Phone</span>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{order.shippingAddress}</p>
              <p>
                {order.shippingCity}
                {order.shippingState && `, ${order.shippingState}`} {order.shippingPostalCode}
              </p>
              <p>{order.shippingCountry?.name || 'N/A'}</p>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Method</span>
                <p className="font-medium">{order.paymentMethod}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Status</span>
                <div className="mt-1">
                  <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
