'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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
  Plus,
  Trash2,
  Save,
  Package,
  Warehouse,
  Ship,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { ProductSearchSelect } from '@/components/admin/ProductSearchSelect'
import { CurrencySelector } from '@/components/ui/CurrencySelector'
import { SupplierSelector } from '@/components/admin/SupplierSelector'
import { useAdminLocale } from '../../../contexts/AdminLocaleContext'

interface POItem {
  id: string
  productId: string
  variantId?: string | null
  productName: string
  productSku: string
  variantName?: string | null
  variantAttributes?: any | null
  quantity: number
  unitPrice: number
  total: number
  notes?: string
}

const editableStatuses = ['DRAFT', 'PENDING', 'SENT', 'CONFIRMED']

export default function EditPurchaseOrderPage() {
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const { dict } = useAdminLocale()
  const poId = params.id as string

  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: '',
    expectedDelivery: '',
    notes: '',
    internalNotes: '',
    isUrgent: false,
    currency: 'CNY',
    tax: 0,
    shippingCost: 0,
    discount: 0,
    status: 'DRAFT',
    purchaseDestination: 'CHINA_WAREHOUSE' as 'CHINA_WAREHOUSE' | 'DIRECT_TO_CONTAINER' | 'DIRECT_TO_CUSTOMER',
    targetCustomerId: '',
    shippingAddress: {
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Belarus',
    },
  })
  const [items, setItems] = useState<POItem[]>([])
  const [exchangeRate, setExchangeRate] = useState(7.2)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [isSupplierOpen, setIsSupplierOpen] = useState(false)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)

  // Fetch the existing purchase order
  const { data: purchaseOrderData, isLoading: poLoading } = useQuery({
    queryKey: ['purchase-order', poId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/purchase-orders/${poId}`)
      if (!res.ok) throw new Error('Failed to fetch purchase order')
      return res.json()
    },
    enabled: !!poId,
  })

  const po = purchaseOrderData?.purchaseOrder
  const isStatusEditable = po ? editableStatuses.includes(po.status) : true

  // Load B2B customers for Direct to Customer destination
  const { data: customersData } = useQuery({
    queryKey: ['b2b-customers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users?limit=200')
      if (!res.ok) return { users: [] }
      return res.json()
    },
  })

  const b2bCustomers = (customersData?.users || []).filter((u: any) =>
    u.userType === 'WHOLESALE' || u.userType === 'BOTH' || u.businessType || u.companyName
  )

  // Load purchase order data into form
  useEffect(() => {
    if (po) {
      const rawAddr = po.shippingAddress
      let parsedAddr = {
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Belarus',
      }
      if (rawAddr && typeof rawAddr === 'object') {
        parsedAddr = {
          address: rawAddr.address || '',
          city: rawAddr.city || '',
          state: rawAddr.state || '',
          postalCode: rawAddr.postalCode || '',
          country: rawAddr.country || 'Belarus',
        }
      }

      setFormData({
        supplierId: po.supplierId || '',
        orderDate: po.orderDate ? new Date(po.orderDate).toISOString().split('T')[0] : '',
        expectedDelivery: po.expectedDelivery ? new Date(po.expectedDelivery).toISOString().split('T')[0] : '',
        notes: po.notes || '',
        internalNotes: po.internalNotes || '',
        isUrgent: po.isUrgent || false,
        currency: po.currency || 'CNY',
        tax: po.tax || 0,
        shippingCost: po.shippingCost || 0,
        discount: po.discount || 0,
        status: po.status || 'DRAFT',
        purchaseDestination: (po.purchaseDestination as any) || 'CHINA_WAREHOUSE',
        targetCustomerId: po.targetCustomerId || '',
        shippingAddress: parsedAddr,
      })
      setExchangeRate(po.exchangeRate || 7.2)
      
      // Load items
      if (po.items) {
        setItems(po.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId || null,
          productName: item.productName || item.product?.name || 'Unknown',
          productSku: item.productSku || item.product?.sku || 'N/A',
          variantName: item.variantName || null,
          variantAttributes: item.variantAttributes || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          notes: item.notes || '',
        })))
      }
    }
  }, [po])

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/suppliers')
      if (!res.ok) throw new Error('Failed to fetch suppliers')
      return res.json()
    },
  })

  // Load products catalog for adding items
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products-with-variants'],
    queryFn: async () => {
      const res = await fetch('/api/admin/products?includeVariants=true&limit=1000&isActive=true')
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    },
  })

  const updatePOMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/purchase-orders/${poId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update purchase order')
      }
      return resData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] })
      toast.success('Purchase order updated successfully')
      router.push(`/admin/purchase-orders/${poId}`)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update purchase order')
    },
  })

  const addProduct = (product: any, variant?: any) => {
    const existing = items.find(
      (item) => item.productId === product.id && (item.variantId === (variant?.id || null))
    )
    if (existing) {
      toast.error('This product or variant is already in the purchase order.')
      return
    }

    const variantName = variant
      ? Object.entries(variant.attributes || {})
          .map(([key, val]) => `${key}: ${val}`)
          .join(' • ')
      : null

    const unitPrice = variant?.costPrice || product.costPrice || variant?.price || product.price || 0

    const newItem: POItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: product.id,
      variantId: variant?.id || null,
      productName: product.name,
      productSku: variant?.sku || product.sku || 'N/A',
      variantName,
      variantAttributes: variant?.attributes || null,
      quantity: 1,
      unitPrice,
      total: unitPrice,
    }

    setItems((prev) => [...prev, newItem])
    const label = variantName ? `${product.name} (${variantName})` : product.name
    toast.success(`Added ${label}`)
  }

  const updateItem = (id: string, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = Number(updated.quantity) * Number(updated.unitPrice)
          }
          return updated
        }
        return item
      })
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    toast.success('Item removed')
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal + formData.tax + formData.shippingCost - formData.discount
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isStatusEditable) {
      toast.error(`Cannot edit order with status ${po?.status}. Only DRAFT, PENDING, SENT, and CONFIRMED orders can be edited.`)
      return
    }

    if (!formData.supplierId) {
      toast.error('Please select a supplier')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one product item')
      return
    }

    if (formData.purchaseDestination === 'DIRECT_TO_CUSTOMER' && !formData.targetCustomerId) {
      toast.error('Please select a Target B2B Customer for Direct to Customer delivery')
      return
    }

    const payload = {
      ...formData,
      subtotal: calculateSubtotal(),
      total: calculateTotal(),
      exchangeRate,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.productName,
        productSku: item.productSku,
        variantName: item.variantName || null,
        variantAttributes: item.variantAttributes || null,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        notes: item.notes || null,
      })),
    }

    updatePOMutation.mutate(payload)
  }

  if (poLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a3a5c]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/purchase-orders/${poId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Order
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[#1a3a5c]">Edit Purchase Order</h1>
              {po?.poNumber && <Badge variant="outline" className="text-sm font-semibold">{po.poNumber}</Badge>}
              {po?.status && (
                <Badge className={isStatusEditable ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'}>
                  {po.status}
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">Modify purchase destination, order items, and procurement parameters</p>
          </div>
        </div>
      </div>

      {/* Lock warning if not editable */}
      {!isStatusEditable && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Order Status Locked for Editing</div>
            <div className="text-xs text-amber-800 mt-0.5">
              This purchase order is in <strong>{po?.status}</strong> status. Orders can only be edited while in{' '}
              <strong>DRAFT</strong>, <strong>PENDING</strong>, <strong>SENT</strong>, or <strong>CONFIRMED</strong> status.
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PURCHASE DESTINATION SELECTION CARD */}
        <Card className="border-indigo-200 shadow-xs bg-gradient-to-br from-white via-indigo-50/20 to-white">
          <CardHeader className="pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Ship className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Purchase Destination & Logistics Lifecycle *
                </CardTitle>
                <CardDescription className="text-xs">
                  Determines whether goods enter China warehouse stock, ship directly in a container, or deliver to a B2B client.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Store in China Warehouse */}
              <div
                onClick={() => isStatusEditable && setFormData({ ...formData, purchaseDestination: 'CHINA_WAREHOUSE' })}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  formData.purchaseDestination === 'CHINA_WAREHOUSE'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                } ${!isStatusEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <input
                    type="radio"
                    name="purchaseDestination"
                    disabled={!isStatusEditable}
                    checked={formData.purchaseDestination === 'CHINA_WAREHOUSE'}
                    onChange={() => setFormData({ ...formData, purchaseDestination: 'CHINA_WAREHOUSE' })}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <h4 className="font-bold text-sm text-foreground mt-2">
                  Store in China Warehouse
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Goods will be received into China Procurement DC inventory first for storage or selective dispatch.
                </p>
                <Badge variant="outline" className="mt-2.5 text-[10px] bg-white border-emerald-300 text-emerald-800">
                  Default Procurement
                </Badge>
              </div>

              {/* Option 2: Direct to Container */}
              <div
                onClick={() => isStatusEditable && setFormData({ ...formData, purchaseDestination: 'DIRECT_TO_CONTAINER' })}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  formData.purchaseDestination === 'DIRECT_TO_CONTAINER'
                    ? 'border-sky-600 bg-sky-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                } ${!isStatusEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Ship className="w-4 h-4" />
                  </div>
                  <input
                    type="radio"
                    name="purchaseDestination"
                    disabled={!isStatusEditable}
                    checked={formData.purchaseDestination === 'DIRECT_TO_CONTAINER'}
                    onChange={() => setFormData({ ...formData, purchaseDestination: 'DIRECT_TO_CONTAINER' })}
                    className="mt-1 text-sky-600 focus:ring-sky-500"
                  />
                </div>
                <h4 className="font-bold text-sm text-foreground mt-2">
                  Direct to Container for Belarus
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Goods bypass China warehouse and load directly into a container heading for Belarus DC.
                </p>
                <Badge variant="outline" className="mt-2.5 text-[10px] bg-white border-sky-300 text-sky-800">
                  FCL / Cross-docking
                </Badge>
              </div>

              {/* Option 3: Direct to Customer - B2B */}
              <div
                onClick={() => isStatusEditable && setFormData({ ...formData, purchaseDestination: 'DIRECT_TO_CUSTOMER' })}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  formData.purchaseDestination === 'DIRECT_TO_CUSTOMER'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                } ${!isStatusEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="radio"
                    name="purchaseDestination"
                    disabled={!isStatusEditable}
                    checked={formData.purchaseDestination === 'DIRECT_TO_CUSTOMER'}
                    onChange={() => setFormData({ ...formData, purchaseDestination: 'DIRECT_TO_CUSTOMER' })}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <h4 className="font-bold text-sm text-foreground mt-2">
                  Direct to Customer - B2B
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Wholesale container order shipped directly to buyer address with auto-created sales order.
                </p>
                <Badge variant="outline" className="mt-2.5 text-[10px] bg-white border-indigo-300 text-indigo-800">
                  Wholesale Direct
                </Badge>
              </div>
            </div>

            {/* Conditional B2B Target Customer & Delivery Address Fields */}
            {formData.purchaseDestination === 'DIRECT_TO_CUSTOMER' && (
              <div className="mt-4 p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      B2B Direct Delivery Configuration
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-700 font-medium">
                    Assigned wholesale client for direct shipping.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="targetCustomerSelect" className="text-xs font-semibold">
                      Target Customer (B2B) *
                    </Label>
                    <Select
                      value={formData.targetCustomerId}
                      onValueChange={(val) => setFormData({ ...formData, targetCustomerId: val })}
                      disabled={!isStatusEditable}
                    >
                      <SelectTrigger id="targetCustomerSelect" className="bg-white">
                        <SelectValue placeholder="Select B2B Customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {b2bCustomers.map((cust: any) => (
                          <SelectItem key={cust.id} value={cust.id}>
                            {cust.companyName ? `${cust.companyName} (${cust.name})` : cust.name} — {cust.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="destCountry" className="text-xs font-semibold">
                      Destination Country
                    </Label>
                    <Input
                      id="destCountry"
                      className="bg-white"
                      disabled={!isStatusEditable}
                      value={formData.shippingAddress.country}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, country: e.target.value },
                        })
                      }
                      placeholder="e.g. Belarus"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="destStreet" className="text-xs font-semibold">
                      Street Address
                    </Label>
                    <Input
                      id="destStreet"
                      className="bg-white"
                      disabled={!isStatusEditable}
                      value={formData.shippingAddress.address}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, address: e.target.value },
                        })
                      }
                      placeholder="e.g. Pr. Dzerzhinskogo 104, Office 402"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="destCity" className="text-xs font-semibold">
                      City
                    </Label>
                    <Input
                      id="destCity"
                      className="bg-white"
                      disabled={!isStatusEditable}
                      value={formData.shippingAddress.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, city: e.target.value },
                        })
                      }
                      placeholder="e.g. Minsk"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>Basic purchase order details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SupplierSelector
                suppliers={suppliers?.suppliers || []}
                selectedSupplierId={formData.supplierId}
                onSelectSupplier={(supplierId) => setFormData({ ...formData, supplierId })}
                disabled={!isStatusEditable}
                label="Supplier"
                placeholder="Search and select supplier..."
                required
              />

              <CurrencySelector
                currency={formData.currency}
                onCurrencyChange={(currency) => setFormData({ ...formData, currency })}
                rate={exchangeRate}
                onRateChange={setExchangeRate}
                disabled={!isStatusEditable}
                baseCurrency="USD"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderDate" className="block text-sm font-medium">Order Date *</Label>
                <Input
                  id="orderDate"
                  type="date"
                  disabled={!isStatusEditable}
                  value={formData.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                  required
                  style={{ colorScheme: 'light' }}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDelivery" className="block text-sm font-medium">Expected Delivery</Label>
                <Input
                  id="expectedDelivery"
                  type="date"
                  disabled={!isStatusEditable}
                  value={formData.expectedDelivery}
                  onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                  style={{ colorScheme: 'light' }}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderStatus" className="block text-sm font-medium">Order Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => {
                    setFormData({ ...formData, status: val })
                  }}
                >
                  <SelectTrigger id="orderStatus" className="bg-white">
                    <SelectValue placeholder="Select Status" />
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

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isUrgent"
                  disabled={!isStatusEditable}
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                  className="w-4 h-4 rounded text-[#1a3a5c]"
                />
                <Label htmlFor="isUrgent" className="text-sm font-medium">
                  Mark as Urgent
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                Add, remove, or modify product quantities and unit costs
              </CardDescription>
            </div>
            {isStatusEditable && (
              <Button
                type="button"
                onClick={() => setIsProductDialogOpen(true)}
                variant="outline"
                size="sm"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-lg font-medium text-gray-600">No items in this purchase order</p>
                  <p className="text-sm text-gray-500 mt-1">Click &ldquo;Add Product&rdquo; above to add catalog products or variants.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-4 border rounded-xl space-y-3 bg-white shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base text-gray-900">{item.productName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          SKU: <span className="font-mono">{item.productSku}</span>
                          {item.variantName && (
                            <>
                              {' • '}
                              <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                                {item.variantName}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      {isStatusEditable && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Quantity</Label>
                        <Input
                          type="number"
                          disabled={!isStatusEditable}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                          min="1"
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Unit Price ({formData.currency})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          disabled={!isStatusEditable}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                          min="0"
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Total ({formData.currency})</Label>
                        <div className="text-base font-bold text-gray-900 mt-2">
                          {Number(item.total).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Order Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tax">Tax</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.01"
                  disabled={!isStatusEditable}
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="shippingCost">Shipping Cost</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  step="0.01"
                  disabled={!isStatusEditable}
                  value={formData.shippingCost}
                  onChange={(e) => setFormData({ ...formData, shippingCost: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="discount">Discount</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  disabled={!isStatusEditable}
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                  min="0"
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({formData.currency}):</span>
                <span className="font-medium">{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({formData.currency}):</span>
                <span className="font-medium">{Number(formData.tax || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping ({formData.currency}):</span>
                <span className="font-medium">{Number(formData.shippingCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount ({formData.currency}):</span>
                <span className="font-medium text-red-500">-{Number(formData.discount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total ({formData.currency}):</span>
                <span className="text-[#1a3a5c]">{calculateTotal().toFixed(2)}</span>
              </div>
              {formData.currency !== 'USD' && (
                <>
                  <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                    <span>Exchange Rate:</span>
                    <span>1 USD = {exchangeRate.toFixed(6)} {formData.currency}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-green-700">
                    <span>Total (USD):</span>
                    <span>${(calculateTotal() / exchangeRate).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (visible to supplier)</Label>
              <Textarea
                id="notes"
                disabled={!isStatusEditable}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="internalNotes">Internal Notes (internal only)</Label>
              <Textarea
                id="internalNotes"
                disabled={!isStatusEditable}
                value={formData.internalNotes}
                onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/admin/purchase-orders/${poId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          {isStatusEditable && (
            <Button
              type="submit"
              className="bg-[#1a3a5c] hover:bg-[#1a3a5c]/90 text-white"
              disabled={updatePOMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updatePOMutation.isPending ? 'Updating...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </form>

      {/* Product Selection Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Products to Order</DialogTitle>
            <DialogDescription>
              Select products or variants from the catalog to add to this purchase order.
            </DialogDescription>
          </DialogHeader>
          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#1a3a5c]" />
            </div>
          ) : (
            <ProductSearchSelect
              products={products?.data || []}
              onSelect={addProduct}
              onClose={() => setIsProductDialogOpen(false)}
              selectedIds={items.map((i) => i.productId)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
