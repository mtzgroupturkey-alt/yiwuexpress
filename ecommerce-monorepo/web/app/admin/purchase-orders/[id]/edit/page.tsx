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
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { CurrencySelector } from '@/components/ui/CurrencySelector'

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
}

export default function EditPurchaseOrderPage() {
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
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
  })
  const [items, setItems] = useState<POItem[]>([])
  const [exchangeRate, setExchangeRate] = useState(7.2)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [isSupplierOpen, setIsSupplierOpen] = useState(false)

  // Fetch the existing purchase order
  const { data: purchaseOrder, isLoading: poLoading } = useQuery({
    queryKey: ['purchase-order', poId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/purchase-orders/${poId}`)
      if (!res.ok) throw new Error('Failed to fetch purchase order')
      return res.json()
    },
    enabled: !!poId,
  })

  // Load purchase order data into form
  useEffect(() => {
    if (purchaseOrder?.purchaseOrder) {
      const po = purchaseOrder.purchaseOrder
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
      })
      setExchangeRate(po.exchangeRate || 7.2)
      
      // Load items
      if (po.items) {
        setItems(po.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName || item.product?.name || 'Unknown',
          productSku: item.productSku || item.product?.sku || 'N/A',
          variantName: item.variantName,
          variantAttributes: item.variantAttributes,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })))
      }
    }
  }, [purchaseOrder])

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/suppliers')
      if (!res.ok) throw new Error('Failed to fetch suppliers')
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
      if (!res.ok) throw new Error('Failed to update purchase order')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] })
      toast.success('Purchase order updated successfully')
      router.push('/admin/purchase-orders')
    },
    onError: () => {
      toast.error('Failed to update purchase order')
    },
  })

  const updateItem = (id: string, field: string, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice
          }
          return updated
        }
        return item
      })
    )
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

    if (!formData.supplierId) {
      toast.error('Please select a supplier')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    const data = {
      ...formData,
      subtotal: calculateSubtotal(),
      total: calculateTotal(),
      exchangeRate,
      items: items.map(({ productName, productSku, ...item }) => item),
    }

    updatePOMutation.mutate(data)
  }

  if (poLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1a3a5c] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a3a5c]">Edit Purchase Order</h1>
          <p className="text-gray-500 mt-1">Update purchase order details</p>
        </div>
        <Link href="/admin/purchase-orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>Basic purchase order details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="supplierId">Supplier *</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search and select supplier..."
                    value={
                      formData.supplierId
                        ? suppliers?.suppliers?.find((s: any) => s.id === formData.supplierId)?.name || ''
                        : supplierSearch
                    }
                    onChange={(e) => {
                      setSupplierSearch(e.target.value)
                      setIsSupplierOpen(true)
                      if (!e.target.value) {
                        setFormData({ ...formData, supplierId: '' })
                      }
                    }}
                    onFocus={() => setIsSupplierOpen(true)}
                    className="h-10"
                  />
                  {isSupplierOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {suppliers?.suppliers
                        ?.filter((supplier: any) =>
                          supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
                        )
                        .map((supplier: any) => (
                          <div
                            key={supplier.id}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setFormData({ ...formData, supplierId: supplier.id })
                              setSupplierSearch('')
                              setIsSupplierOpen(false)
                            }}
                          >
                            {supplier.name}
                          </div>
                        ))}
                      {suppliers?.suppliers?.filter((supplier: any) =>
                        supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-sm">No suppliers found</div>
                      )}
                    </div>
                  )}
                  {isSupplierOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsSupplierOpen(false)}
                    />
                  )}
                </div>
              </div>

              <CurrencySelector
                currency={formData.currency}
                onCurrencyChange={(currency) => setFormData({ ...formData, currency })}
                rate={exchangeRate}
                onRateChange={setExchangeRate}
                baseCurrency="USD"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="orderDate">Order Date *</Label>
                <div className="relative">
                  <Input
                    id="orderDate"
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    required
                    style={{ colorScheme: 'light' }}
                    className="[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                <div className="relative">
                  <Input
                    id="expectedDelivery"
                    type="date"
                    value={formData.expectedDelivery}
                    onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                    style={{ colorScheme: 'light' }}
                    className="[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isUrgent"
                checked={formData.isUrgent}
                onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isUrgent">Mark as Urgent</Label>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>Edit product quantities and prices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-3 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{item.productName}</div>
                      <div className="text-sm text-gray-500">SKU: {item.productSku}</div>
                      {item.variantName && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.variantName}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Unit Price ({formData.currency})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Total ({formData.currency})</Label>
                      <div className="text-lg font-medium mt-2">{item.total.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Order Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tax">Tax</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.01"
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
                <span className="font-medium">{formData.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping ({formData.currency}):</span>
                <span className="font-medium">{formData.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount ({formData.currency}):</span>
                <span className="font-medium text-red-500">-{formData.discount.toFixed(2)}</span>
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

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (visible to supplier)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="internalNotes">Internal Notes (internal only)</Label>
              <Textarea
                id="internalNotes"
                value={formData.internalNotes}
                onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/purchase-orders">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-[#1a3a5c]"
            disabled={updatePOMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updatePOMutation.isPending ? 'Updating...' : 'Update Purchase Order'}
          </Button>
        </div>
      </form>
    </div>
  )
}
