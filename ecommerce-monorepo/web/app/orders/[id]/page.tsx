'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, MapPin, CreditCard, Truck, Check, ExternalLink } from 'lucide-react'

interface Order {
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
  trackingHistory: any[]
  items: Array<{
    id: string
    productName: string
    productSku: string
    productImage?: string
    quantity: number
    price: number
    total: number
  }>
  shippingCountry?: {
    name: string
    flag: string
    code: string
  }
}

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'warning',
  PAID: 'success',
  PROCESSING: 'secondary',
  SHIPPED: 'default',
  DELIVERED: 'success',
  CANCELLED: 'destructive'
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
      })

      const data = await response.json()
      if (data.success) {
        setOrder(data.data)
      } else {
        setError(data.error || 'Order not found')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-800 text-lg">{error || 'Order not found'}</p>
            <Button onClick={() => router.push('/orders')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/orders')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge variant={statusColors[order.status] || 'default'} className="text-lg px-4 py-2">
              {order.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
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
                      <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-2xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-500">SKU: {item.productSku}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${item.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tracking History */}
            {order.trackingHistory && order.trackingHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Tracking History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-4 pl-6">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    {order.trackingHistory.map((event: any, index: number) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-6 w-4 h-4 rounded-full bg-primary border-2 border-white"></div>
                        <div>
                          <p className="font-semibold text-gray-900">{event.status}</p>
                          <p className="text-sm text-gray-600">{event.notes}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(event.timestamp).toLocaleString()}
                            {event.location && ` • ${event.location}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">${order.shippingFee.toFixed(2)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${order.tax.toFixed(2)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">{order.customerName}</p>
                <p className="text-gray-600">{order.shippingAddress}</p>
                <p className="text-gray-600">
                  {order.shippingCity}
                  {order.shippingState && `, ${order.shippingState}`}
                  {' '}{order.shippingPostalCode}
                </p>
                {order.shippingCountry && (
                  <p className="text-gray-600">
                    {order.shippingCountry.flag} {order.shippingCountry.name}
                  </p>
                )}
                <div className="pt-2 border-t">
                  <p className="text-gray-600">{order.customerEmail}</p>
                  <p className="text-gray-600">{order.customerPhone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium">{order.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                {order.paymentStatus === 'UNPAID' && (
                  <Button
                    className="w-full mt-3"
                    onClick={() => router.push(`/payment/${order.id}`)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now - ${order.total.toFixed(2)}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Tracking Number */}
            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {order.carrier && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Carrier</span>
                      <span className="font-medium">{order.carrier}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 block mb-1">Tracking Number</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      {order.trackingNumber}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => router.push(`/track?number=${order.trackingNumber}`)}
                  >
                    Track Shipment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
