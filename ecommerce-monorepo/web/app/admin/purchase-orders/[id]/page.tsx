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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  Package,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  Truck,
  Download,
  Plus,
  Loader2,
  ShieldCheck,
  Ship,
  ExternalLink,
  Warehouse,
  UserCheck,
} from 'lucide-react'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  SENT: 'bg-blue-100 text-blue-800 border-blue-300',
  CONFIRMED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  SHIPPED: 'bg-purple-100 text-purple-800 border-purple-300',
  IN_TRANSIT: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  RECEIVED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  CLOSED: 'bg-gray-100 text-gray-800 border-gray-300',
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { dict, locale, t } = useAdminLocale()

  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [assignContainerModalOpen, setAssignContainerModalOpen] = useState(false)
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({})

  // Fetch Purchase Order
  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/purchase-orders/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch purchase order')
      return res.json()
    },
  })

  // Fetch Containers for assignment modal
  const { data: containersData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['active-containers'],
    queryFn: () => fetch('/api/admin/containers').then((r) => r.json()),
    enabled: assignContainerModalOpen,
  })

  const availableContainers = containersData?.data || []

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/admin/purchase-orders/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update status')
      }
      return res.json()
    },
    onSuccess: (data, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', params.id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success(`PO status updated to ${newStatus}`)
    },
    onError: (err: any) => {
      toast.error(err.message || dict.common.errorOccurred)
    },
  })

  // Receive goods mutation
  const receiveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/purchase-orders/${params.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to receive purchase order')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', params.id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success(dict.purchaseOrders.poReceivedSuccess)
      setReceiveDialogOpen(false)
    },
    onError: (err: any) => {
      toast.error(err.message || dict.common.errorOccurred)
    },
  })

  // Assign to container mutation
  const assignContainerMutation = useMutation({
    mutationFn: async (containerId: string) => {
      const res = await fetch(`/api/admin/containers/${containerId}/assign-po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseOrderId: params.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to assign container')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', params.id] })
      toast.success('PO loaded into container')
      setAssignContainerModalOpen(false)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error assigning container')
    },
  })

  // Unload from container mutation
  const unloadContainerMutation = useMutation({
    mutationFn: async (containerId: string) => {
      const res = await fetch(`/api/admin/containers/${containerId}/remove-po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseOrderId: params.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to unload PO')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', params.id] })
      toast.success('PO unloaded from container')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error unloading PO')
    },
  })

  const handleReceive = () => {
    const items = po?.purchaseOrder?.items?.map((item: any) => ({
      id: item.id,
      receivedQuantity: receivedQuantities[item.id] !== undefined ? receivedQuantities[item.id] : item.quantity,
    }))
    receiveMutation.mutate({ items })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3a5c]" />
      </div>
    )
  }

  const purchaseOrder = po?.purchaseOrder

  if (!purchaseOrder) {
    return <div className="p-6 text-center">{dict.common.noData}</div>
  }

  // Quick next workflow action button
  const getNextAction = () => {
    switch (purchaseOrder.status) {
      case 'DRAFT':
        return (
          <Button
            onClick={() => updateStatusMutation.mutate('SENT')}
            className="bg-[#1a3a5c] hover:bg-[#1a3a5c]/90 text-white"
            disabled={updateStatusMutation.isPending}
          >
            <Truck className="w-4 h-4 mr-2" />
            {dict.purchaseOrders.sendToSupplier}
          </Button>
        )
      case 'SENT':
        return (
          <Button
            onClick={() => updateStatusMutation.mutate('CONFIRMED')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={updateStatusMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Order
          </Button>
        )
      case 'CONFIRMED':
        return (
          <Button
            onClick={() => updateStatusMutation.mutate('SHIPPED')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={updateStatusMutation.isPending}
          >
            <Truck className="w-4 h-4 mr-2" />
            Mark as Shipped
          </Button>
        )
      case 'SHIPPED':
      case 'PARTIALLY_RECEIVED':
        return (
          <Button
            onClick={() => setReceiveDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {dict.purchaseOrders.receiveOrder}
          </Button>
        )
      case 'RECEIVED':
        return (
          <Button
            onClick={() => updateStatusMutation.mutate('CLOSED')}
            className="bg-gray-700 hover:bg-gray-800 text-white"
            disabled={updateStatusMutation.isPending}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Close Purchase Order
          </Button>
        )
      default:
        return null
    }
  }

  const container = purchaseOrder.container

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#1a3a5c]">{purchaseOrder.poNumber}</h1>
            <Badge className={`border text-xs px-2.5 py-1 ${statusColors[purchaseOrder.status] || 'bg-gray-100'}`}>
              {t(purchaseOrder.status, purchaseOrder.status)}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">{dict.purchaseOrders.poDetails}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Direct Status Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Status:</span>
            <Select
              value={purchaseOrder.status}
              onValueChange={(val) => updateStatusMutation.mutate(val)}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="h-9 w-[140px] text-xs font-semibold bg-white">
                <SelectValue>
                  {updateStatusMutation.isPending ? (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    purchaseOrder.status
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">DRAFT</SelectItem>
                <SelectItem value="PENDING">PENDING</SelectItem>
                <SelectItem value="SENT">SENT</SelectItem>
                <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                <SelectItem value="SHIPPED">SHIPPED</SelectItem>
                <SelectItem value="IN_TRANSIT">IN_TRANSIT</SelectItem>
                <SelectItem value="RECEIVED">RECEIVED</SelectItem>
                <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                <SelectItem value="CLOSED">CLOSED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Context Action Button */}
          {getNextAction()}

          {/* Edit Order Button (Editable until CONFIRMED) */}
          {['DRAFT', 'PENDING', 'SENT', 'CONFIRMED'].includes(purchaseOrder.status) && (
            <Link href={`/admin/purchase-orders/${purchaseOrder.id}/edit`}>
              <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 border-slate-300">
                <Package className="w-4 h-4 mr-2 text-[#1a3a5c]" />
                Edit Order
              </Button>
            </Link>
          )}

          {/* Back button */}
          <Link href="/admin/purchase-orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {dict.common.back}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{dict.purchaseOrders.orderItems}</CardTitle>
                <CardDescription>
                  {purchaseOrder.items.length} {dict.purchaseOrders.itemsCount}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchaseOrder.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-500">{dict.products.sku}: {item.productSku}</div>
                      {item.variantName && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.variantName}
                          </Badge>
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-sm text-gray-400 mt-1">{item.notes}</div>
                      )}
                    </div>
                    <div className="text-right space-y-1 pl-4">
                      <div className="text-sm text-gray-500">
                        {dict.wholesale.quantity}: <span className="font-medium text-gray-700">{item.receivedQuantity}/{item.quantity}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        {purchaseOrder.currency} {item.unitPrice.toFixed(2)} × {item.quantity}
                      </div>
                      <div className="font-bold text-[#1a3a5c]">
                        {purchaseOrder.currency} {item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals Breakdown */}
              <div className="border-t mt-6 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{dict.orders.subtotal}:</span>
                  <span className="font-medium">
                    {purchaseOrder.currency} {purchaseOrder.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{dict.orders.tax}:</span>
                  <span className="font-medium">
                    {purchaseOrder.currency} {purchaseOrder.tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{dict.orders.shipping}:</span>
                  <span className="font-medium">
                    {purchaseOrder.currency} {purchaseOrder.shippingCost.toFixed(2)}
                  </span>
                </div>
                {purchaseOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>{dict.orders.discount}:</span>
                    <span className="font-medium text-red-500">
                      -{purchaseOrder.currency} {purchaseOrder.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>PO Supplier Invoice Total:</span>
                  <span className="text-[#1a3a5c]">
                    {purchaseOrder.currency} {purchaseOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Container & Logistics Card */}
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-blue-50/40 border-b border-blue-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-950">
                    <Ship className="w-5 h-5 text-blue-600" />
                    Container Logistics & Shipping
                  </CardTitle>
                  <CardDescription className="text-blue-900/70">
                    Physical container loading, carrier, agent, and port schedule.
                  </CardDescription>
                </div>
                {!container ? (
                  <Button
                    size="sm"
                    className="bg-[#1a3a5c] hover:bg-[#1a3a5c]/90 text-white"
                    onClick={() => setAssignContainerModalOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Load into Container
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => {
                      if (confirm(`Unload this PO from container ${container.containerNumber}?`)) {
                        unloadContainerMutation.mutate(container.id)
                      }
                    }}
                  >
                    Unload from Container
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {!container ? (
                <div className="py-6 text-center text-gray-500">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="font-medium text-gray-700">This Purchase Order is not loaded into any container</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">
                    Assign this PO to an active container to track freight, carrier, and arrival schedule.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssignContainerModalOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Select Container
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100 gap-2">
                    <div>
                      <div className="text-xs text-blue-600 font-semibold uppercase">Loaded in Container</div>
                      <Link
                        href={`/admin/containers/${container.id}`}
                        className="text-lg font-bold text-[#1a3a5c] hover:underline flex items-center gap-1.5"
                      >
                        {container.containerNumber}
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {container.routeType} FREIGHT
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {container.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-gray-50 rounded border">
                      <div className="text-gray-500">Route</div>
                      <div className="font-semibold text-gray-800 mt-0.5">{container.origin} → {container.destination}</div>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded border">
                      <div className="text-gray-500">Carrier</div>
                      <div className="font-semibold text-gray-800 mt-0.5">{container.carrier?.name || 'Unassigned'}</div>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded border">
                      <div className="text-gray-500">Shipping Agent</div>
                      <div className="font-semibold text-gray-800 mt-0.5">{container.agent?.name || 'Unassigned'}</div>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded border">
                      <div className="text-gray-500">Estimated Arrival (ETA)</div>
                      <div className="font-semibold text-gray-800 mt-0.5">
                        {container.arrivalDate ? new Date(container.arrivalDate).toLocaleDateString() : 'TBD'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(purchaseOrder.notes || purchaseOrder.internalNotes) && (
            <Card>
              <CardHeader>
                <CardTitle>{dict.shipments.notes}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {purchaseOrder.notes && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">{dict.purchaseOrders.supplierNotes}</div>
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{purchaseOrder.notes}</div>
                  </div>
                )}
                {purchaseOrder.internalNotes && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">{dict.purchaseOrders.internalNotes}</div>
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{purchaseOrder.internalNotes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar (Right 1 col) */}
        <div className="space-y-6">
          {/* 🆕 Purchase Destination & Logistics Lifecycle Card */}
          <Card className="border-indigo-100 shadow-xs bg-gradient-to-br from-white to-indigo-50/20">
            <CardHeader className="pb-3 border-b border-indigo-50">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-950">
                <Ship className="w-4 h-4 text-indigo-600" />
                {dict.purchaseOrders.purchaseDestination || 'Purchase Destination'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Target Scenario:</div>
                {purchaseOrder.purchaseDestination === 'CHINA_WAREHOUSE' && (
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 gap-1.5 py-1 px-2.5">
                    <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{dict.purchaseOrders.storeInChina || 'China Warehouse (Yiwu DC)'}</span>
                  </Badge>
                )}
                {purchaseOrder.purchaseDestination === 'DIRECT_TO_CONTAINER' && (
                  <Badge className="bg-sky-50 text-sky-800 border-sky-300 gap-1.5 py-1 px-2.5">
                    <Ship className="w-3.5 h-3.5 text-sky-600" />
                    <span>{dict.purchaseOrders.directToContainer || 'Direct to Container (Belarus)'}</span>
                  </Badge>
                )}
                {purchaseOrder.purchaseDestination === 'DIRECT_TO_CUSTOMER' && (
                  <Badge className="bg-indigo-50 text-indigo-800 border-indigo-300 gap-1.5 py-1 px-2.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{dict.purchaseOrders.directToCustomer || 'Direct to Customer (B2B)'}</span>
                  </Badge>
                )}
              </div>

              {/* If Direct to Customer: show Target Customer & Linked Order */}
              {purchaseOrder.purchaseDestination === 'DIRECT_TO_CUSTOMER' && (
                <div className="space-y-3 pt-2 border-t border-indigo-100/60">
                  {purchaseOrder.targetCustomer && (
                    <div className="p-2.5 bg-white rounded-lg border border-indigo-100 space-y-1">
                      <div className="text-[11px] font-semibold text-indigo-900 uppercase">
                        {dict.purchaseOrders.targetCustomer || 'Target B2B Customer'}
                      </div>
                      <div className="text-xs font-bold text-gray-900">
                        {purchaseOrder.targetCustomer.companyName || purchaseOrder.targetCustomer.name}
                      </div>
                      <div className="text-[11px] text-gray-500">{purchaseOrder.targetCustomer.email}</div>
                    </div>
                  )}

                  {purchaseOrder.linkedOrder && (
                    <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-1">
                      <div className="text-[11px] font-semibold text-emerald-900 uppercase">
                        {dict.purchaseOrders.linkedSalesOrder || 'Linked Sales Order'}
                      </div>
                      <Link
                        href={`/admin/orders/${purchaseOrder.linkedOrder.id}`}
                        className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                      >
                        {purchaseOrder.linkedOrder.orderNumber}
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                      </Link>
                      <div className="text-[11px] text-emerald-700">
                        Status: <span className="font-semibold">{purchaseOrder.linkedOrder.status}</span> • ${(purchaseOrder.linkedOrder.total || 0).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {purchaseOrder.shippingAddress && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-gray-600 space-y-0.5">
                      <div className="text-[11px] font-semibold text-gray-700">
                        {dict.purchaseOrders.shippingAddress || 'Delivery Address'}:
                      </div>
                      <div>{(purchaseOrder.shippingAddress as any).address || '—'}</div>
                      <div>
                        {[(purchaseOrder.shippingAddress as any).city, (purchaseOrder.shippingAddress as any).country]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{dict.suppliers.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">{purchaseOrder.supplier.name}</div>
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
              <CardTitle className="text-lg">{dict.purchaseOrders.orderInformation}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-500">{dict.purchaseOrders.orderDate}</div>
                  <div className="font-medium">
                    {new Date(purchaseOrder.orderDate).toLocaleDateString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US')}
                  </div>
                </div>
              </div>
              {purchaseOrder.expectedDelivery && (
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-gray-500">{dict.purchaseOrders.expectedDate}</div>
                    <div className="font-medium">
                      {new Date(purchaseOrder.expectedDelivery).toLocaleDateString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US')}
                    </div>
                  </div>
                </div>
              )}
              {purchaseOrder.receivedDate && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-gray-500">{dict.status.RECEIVED}</div>
                    <div className="font-medium">
                      {new Date(purchaseOrder.receivedDate).toLocaleDateString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US')}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-500">{dict.orders.paymentStatus}</div>
                  <div className="font-medium">
                    {purchaseOrder.isPaid ? (
                      <Badge className="bg-green-100 text-green-800">{dict.status.PAID}</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">{dict.status.PENDING}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{dict.common.actions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => window.print()}
              >
                <Download className="w-4 h-4 mr-2" />
                {dict.orders.printInvoice}
              </Button>
              {purchaseOrder.status !== 'CANCELLED' && purchaseOrder.status !== 'CLOSED' && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                  size="sm"
                  onClick={() => {
                    if (confirm(dict.purchaseOrders.cancelPOConfirm)) {
                      updateStatusMutation.mutate('CANCELLED')
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {dict.common.cancel}
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
            <DialogTitle>{dict.purchaseOrders.receiveDialogTitle}</DialogTitle>
            <DialogDescription>
              {dict.purchaseOrders.receiveDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {purchaseOrder.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-3 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-gray-500">{dict.status.ORDERED}: {item.quantity}</div>
                </div>
                <div className="w-32">
                  <Label htmlFor={`qty-${item.id}`}>{dict.purchaseOrders.receivedQuantity}</Label>
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
              {dict.common.cancel}
            </Button>
            <Button
              onClick={handleReceive}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={receiveMutation.isPending}
            >
              {receiveMutation.isPending ? dict.purchaseOrders.receiving : dict.purchaseOrders.confirmReceipt}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign to Container Modal */}
      <Dialog open={assignContainerModalOpen} onOpenChange={setAssignContainerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Load PO into Container</DialogTitle>
            <DialogDescription>
              Select an active container to load PO #{purchaseOrder.poNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3 max-h-64 overflow-y-auto">
            {availableContainers.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No containers found. Create a container first.</p>
            ) : (
              availableContainers.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 text-sm cursor-pointer"
                  onClick={() => assignContainerMutation.mutate(c.id)}
                >
                  <div>
                    <div className="font-bold text-[#1a3a5c]">{c.containerNumber}</div>
                    <div className="text-xs text-gray-500">{c.origin} → {c.destination} ({c.routeType})</div>
                  </div>
                  <Button size="sm" className="bg-[#1a3a5c] text-white">
                    Select
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
