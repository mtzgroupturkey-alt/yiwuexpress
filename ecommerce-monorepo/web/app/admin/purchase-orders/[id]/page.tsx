'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  Package,
  Calendar,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Truck,
  Download,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  RECEIVED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  CLOSED: 'bg-gray-100 text-gray-800',
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({})

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/purchase-orders/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch purchase order')
      return res.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/admin/purchase-orders/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', params.id] })
      toast.success('Status updated successfully')
    },
    onError: () => {
      toast.error('Failed to update status')
    },
  })

  const receiveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/purchase-orders/${params.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to receive purchase order')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', params.id] })
      toast.success('Purchase order received successfully. Inventory updated.')
      setReceiveDialogOpen(false)
    },
    onError: () => {
      toast.error('Failed to receive purchase order')
    },
  })

  const handleReceive = () => {
    const items = po?.purchaseOrder?.items?.map((item: any) => ({
      id: item.id,
      receivedQuantity: receivedQuantities[item.id] || item.quantity,
    }))
    receiveMutation.mutate({ items })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1a3a5c] rounded-full animate-spin"></div>
      </div>
    )
  }

  const purchaseOrder = po?.purchaseOrder

  if (!purchaseOrder) {
    return <div>Purchase order not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/purchase-orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#1a3a5c]">{purchaseOrder.poNumber}</h1>
            <p className="text-gray-500 mt-1">Purchase Order Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusColors[purchaseOrder.status]}>{purchaseOrder.status}</Badge>
          {purchaseOrder.status === 'SHIPPED' && (
            <Button onClick={() => setReceiveDialogOpen(true)} className="bg-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              Receive Order
            </Button>
          )}
          {purchaseOrder.status === 'DRAFT' && (
            <Button onClick={() => updateStatusMutation.mutate('SENT')} className="bg-[#1a3a5c]">
              Send to Supplier
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>{purchaseOrder.items.length} items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchaseOrder.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-500">SKU: {item.productSku}</div>
                      {item.notes && (
                        <div className="text-sm text-gray-400 mt-1">{item.notes}</div>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm text-gray-500">
                        Qty: {item.receivedQuantity}/{item.quantity}
                      </div>
                      <div className="font-medium">
                        {purchaseOrder.currency} {item.unitPrice.toFixed(2)} × {item.quantity}
                      </div>
                      <div className="font-bold text-[#1a3a5c]">
                        {purchaseOrder.currency} {item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t mt-6 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {purchaseOrder.currency} {purchaseOrder.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span className="font-medium">
                    {purchaseOrder.currency} {purchaseOrder.tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span className="font-medium">
                    {purchaseOrder.currency} {purchaseOrder.shippingCost.toFixed(2)}
                  </span>
                </div>
                {purchaseOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span className="font-medium text-red-500">
                      -{purchaseOrder.currency} {purchaseOrder.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-[#1a3a5c]">
                    {purchaseOrder.currency} {purchaseOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(purchaseOrder.notes || purchaseOrder.internalNotes) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {purchaseOrder.notes && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Supplier Notes</div>
                    <div className="text-sm">{purchaseOrder.notes}</div>
                  </div>
                )}
                {purchaseOrder.internalNotes && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Internal Notes</div>
                    <div className="text-sm">{purchaseOrder.internalNotes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium">{purchaseOrder.supplier.name}</div>
                  {purchaseOrder.supplier.companyName && (
                    <div className="text-sm text-gray-500">{purchaseOrder.supplier.companyName}</div>
                  )}
                </div>
              </div>
              {purchaseOrder.supplier.email && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Package className="w-4 h-4 text-gray-400" />
                  {purchaseOrder.supplier.email}
                </div>
              )}
              {purchaseOrder.supplier.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Package className="w-4 h-4 text-gray-400" />
                  {purchaseOrder.supplier.phone}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-500">Order Date</div>
                  <div className="font-medium">
                    {new Date(purchaseOrder.orderDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {purchaseOrder.expectedDelivery && (
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-gray-500">Expected Delivery</div>
                    <div className="font-medium">
                      {new Date(purchaseOrder.expectedDelivery).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
              {purchaseOrder.receivedDate && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-gray-500">Received Date</div>
                    <div className="font-medium">
                      {new Date(purchaseOrder.receivedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-500">Payment Status</div>
                  <div className="font-medium">
                    {purchaseOrder.isPaid ? (
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              {purchaseOrder.status !== 'CANCELLED' && purchaseOrder.status !== 'CLOSED' && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-500"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this purchase order?')) {
                      updateStatusMutation.mutate('CANCELLED')
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receive Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive Purchase Order</DialogTitle>
            <DialogDescription>
              Confirm received quantities. This will update inventory stock levels.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {purchaseOrder.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-3 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-gray-500">Ordered: {item.quantity}</div>
                </div>
                <div className="w-32">
                  <Label htmlFor={`qty-${item.id}`}>Received</Label>
                  <Input
                    id={`qty-${item.id}`}
                    type="number"
                    min="0"
                    max={item.quantity}
                    defaultValue={item.quantity}
                    onChange={(e) =>
                      setReceivedQuantities({
                        ...receivedQuantities,
                        [item.id]: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReceive}
              className="bg-green-600"
              disabled={receiveMutation.isPending}
            >
              {receiveMutation.isPending ? 'Receiving...' : 'Confirm Receipt'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
