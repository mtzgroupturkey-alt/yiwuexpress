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
  Loader2
} from 'lucide-react'
import Link from 'next/link'

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
        toast({ title: 'Order updated!' })
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast({ title: 'Failed to update order', variant: 'destructive' })
    }
  }

  const handleSaveShipping = () => {
    if (!order) return
    updateOrderMutation.mutate({
      carrierType,
      customerCarrier: carrierType === 'CUSTOMER' ? customerCarrier : undefined,
      customerCarrierTracking: carrierType === 'CUSTOMER' ? customerCarrierTracking : undefined,
      customerCarrierContact: carrierType === 'CUSTOMER' ? customerCarrierContact : undefined,
      customerCarrierNotes: carrierType === 'CUSTOMER' ? customerCarrierNotes : undefined,
      carrier: carrierType === 'COMPANY' ? companyCarrier : undefined,
      trackingNumber: carrierType === 'COMPANY' ? companyTracking : undefined,
      estimatedDelivery: estimatedDelivery || undefined,
      status: companyTracking ? 'SHIPPED' : undefined,
    })
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <Button onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
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
        <div className="flex items-center gap-2">
          {order.carrierType === 'CUSTOMER' && (
            <Badge className="bg-purple-100 text-purple-800">Customer Carrier</Badge>
          )}
          {order.containerId && (
            <Badge className="bg-blue-100 text-blue-800">Container</Badge>
          )}
          <Badge variant={statusColors[order.status] || 'default'}>
            {order.status}
          </Badge>
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
          Order Details
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
          Shipping & Fulfillment
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
                  Order Items
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
                            <span className="font-semibold">{event.status}</span>
                            <span className="text-sm text-gray-600">
                              {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
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
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <Label>Status</Label>
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
                      <Label>Carrier</Label>
                      <Input
                        value={editedCarrier}
                        onChange={(e) => setEditedCarrier(e.target.value)}
                        placeholder="e.g., DHL, FedEx, China Post"
                      />
                    </div>
                    <div>
                      <Label>Tracking Number</Label>
                      <Input
                        value={editedTracking}
                        onChange={(e) => setEditedTracking(e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </div>
                    <div>
                      <Label>Admin Notes</Label>
                      <Textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="Internal notes about this order"
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveOrder} className="flex-1 bg-[#1a3a5c] hover:bg-[#2a5a8c]">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
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
                        <p className="text-sm mt-1 whitespace-pre-wrap">{order.adminNotes}</p>
                      </div>
                    )}
                    <Button onClick={() => setEditing(true)} className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Order
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
      ) : (
        /* ======= SHIPPING & FULFILLMENT TAB ======= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Current Shipping Status */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Current Shipping Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.carrierType === 'CUSTOMER' ? (
                  <div className="space-y-3">
                    <Badge className="bg-purple-100 text-purple-800">Customer's Own Carrier</Badge>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">Carrier Name</p>
                        <p className="font-medium">{order.customerCarrier || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tracking Number</p>
                        <p className="font-medium">{order.customerCarrierTracking || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Contact</p>
                        <p className="font-medium">{order.customerCarrierContact || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Notes</p>
                        <p className="font-medium">{order.customerCarrierNotes || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : order.containerId ? (
                  <div className="space-y-3">
                    <Badge className="bg-blue-100 text-blue-800">Container Shipping</Badge>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">Container Number</p>
                        <p className="font-medium font-mono">{order.containerNumber}</p>
                      </div>
                      {order.carrier && (
                        <div>
                          <p className="text-gray-500">Carrier</p>
                          <p className="font-medium">{order.carrier}</p>
                        </div>
                      )}
                    </div>
                    <Link href={`/admin/containers/${order.containerId}`}>
                      <Button variant="outline" size="sm">
                        <Ship className="w-4 h-4 mr-1" />
                        View Container
                      </Button>
                    </Link>
                  </div>
                ) : order.trackingNumber ? (
                  <div className="space-y-3">
                    <Badge className="bg-green-100 text-green-800">Shipped</Badge>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">Carrier</p>
                        <p className="font-medium">{order.carrier || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tracking Number</p>
                        <p className="font-medium font-mono">{order.trackingNumber}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Package className="w-16 h-16 mx-auto text-gray-200 mb-3" />
                    <p className="font-medium text-gray-500">No shipping information yet</p>
                    <p className="text-sm mt-1">Use the form to update shipping details</p>
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
                <CardTitle className="text-base">Update Shipping</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label>Shipping Type</Label>
                    <Select
                      value={carrierType}
                      onValueChange={setCarrierType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPANY">Company Shipping</SelectItem>
                        <SelectItem value="CUSTOMER">Customer's Own Carrier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {carrierType === 'COMPANY' && (
                    <>
                      <div>
                        <Label>Carrier</Label>
                        <Select value={companyCarrier} onValueChange={setCompanyCarrier}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select carrier" />
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
                        <Label>Tracking Number</Label>
                        <Input
                          value={companyTracking}
                          onChange={(e) => setCompanyTracking(e.target.value)}
                          placeholder="Enter tracking number"
                        />
                      </div>
                      <div>
                        <Label>Estimated Delivery</Label>
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
                        <Label>Customer Carrier Name *</Label>
                        <Input
                          value={customerCarrier}
                          onChange={(e) => setCustomerCarrier(e.target.value)}
                          placeholder="e.g., Customer's Freight Forwarder"
                        />
                      </div>
                      <div>
                        <Label>Tracking Number</Label>
                        <Input
                          value={customerCarrierTracking}
                          onChange={(e) => setCustomerCarrierTracking(e.target.value)}
                          placeholder="Tracking number if available"
                        />
                      </div>
                      <div>
                        <Label>Contact Info</Label>
                        <Input
                          value={customerCarrierContact}
                          onChange={(e) => setCustomerCarrierContact(e.target.value)}
                          placeholder="Phone or email"
                        />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Input
                          value={customerCarrierNotes}
                          onChange={(e) => setCustomerCarrierNotes(e.target.value)}
                          placeholder="Additional notes"
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
                        Updating...
                      </>
                    ) : (
                      'Update Shipping'
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
                    Assign to Container
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label>Select Container</Label>
                      <Select
                        value={containerId}
                        onValueChange={setContainerId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select container..." />
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
                    <Button
                      onClick={handleAssignContainer}
                      disabled={assignContainerMutation.isPending || !containerId}
                      className="w-full bg-[#1a3a5c] hover:bg-[#2a5a8c]"
                    >
                      {assignContainerMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        'Assign to Container'
                      )}
                    </Button>
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
                    Container
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium font-mono mb-3">{order.containerNumber}</p>
                  <Link href={`/admin/containers/${order.containerId}`}>
                    <Button variant="outline" className="w-full">
                      <Ship className="w-4 h-4 mr-2" />
                      View Container Details
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
