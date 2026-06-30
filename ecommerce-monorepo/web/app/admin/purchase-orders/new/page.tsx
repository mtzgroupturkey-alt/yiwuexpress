'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Plus, Trash2, Save, Package, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { ProductSearchSelect } from '@/components/admin/ProductSearchSelect'
import { CurrencySelector } from '@/components/ui/CurrencySelector'

interface POItem {
  id: string
  productId: string
  variantId: string | null
  productName: string
  productSku: string
  variantName: string | null
  variantAttributes: any | null
  quantity: number
  unitPrice: number
  total: number
  notes?: string
  categoryId?: string | null
  parentCategoryId?: string | null
  // For variant form fields
  availableVariantAttributes?: any[]
}

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
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
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [exchangeRate, setExchangeRate] = useState(7.2)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [isSupplierOpen, setIsSupplierOpen] = useState(false)
  const [itemVariantAttributes, setItemVariantAttributes] = useState<Record<string, any[]>>({})
  const [expandedVariantForms, setExpandedVariantForms] = useState<Record<string, boolean>>({})

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/suppliers')
      if (!res.ok) throw new Error('Failed to fetch suppliers')
      return res.json()
    },
  })

  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products-with-variants'],
    queryFn: async () => {
      const res = await fetch('/api/admin/products?includeVariants=true&limit=1000&isActive=true')
      if (!res.ok) {
        const errorData = await res.text()
        console.error('Failed to fetch products:', errorData)
        throw new Error('Failed to fetch products')
      }
      const data = await res.json()
      console.log('Products loaded:', data)
      return data
    },
  })

  const createPOMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const responseData = await res.json()
      
      if (!res.ok) {
        console.error('API Error Response:', responseData)
        throw new Error(responseData.error || 'Failed to create purchase order')
      }
      
      return responseData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Purchase order created successfully')
      router.push('/admin/purchase-orders')
    },
    onError: (error: any) => {
      console.error('Mutation error:', error)
      toast.error(error.message || 'Failed to create purchase order')
    },
  })

  const addProduct = async (product: any, variant?: any) => {
    // Check if product with variant already in items
    const existingItem = items.find(item => 
      item.productId === product.id && 
      (item.variantId === (variant?.id || null))
    )
    
    if (existingItem) {
      toast.error('Product variant already added to this purchase order')
      return
    }

    const variantName = variant
      ? Object.entries(variant.attributes || {})
          .map(([key, value]) => `${key}: ${value}`)
          .join(' • ')
      : null

    const unitPrice = variant?.costPrice || product.costPrice || variant?.price || product.price || 0

    const categoryId = product.category?.id || null
    const parentCategoryId = product.category?.parent?.id || product.category?.parentId || null

    // Fetch variant attributes for this product
    let variantAttributes: any[] = []
    if (categoryId || parentCategoryId) {
      variantAttributes = await fetchCategoryAttributesForItem(categoryId, parentCategoryId)
      console.log('Fetched variant attributes for product:', product.name, variantAttributes)
    }

    const newItem: POItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      variantId: variant?.id || null,
      productName: product.name,
      productSku: variant?.sku || product.sku || 'N/A',
      variantName,
      variantAttributes: variant?.attributes || {},
      quantity: 1,
      unitPrice,
      total: unitPrice,
      categoryId,
      parentCategoryId,
      availableVariantAttributes: variantAttributes,
    }

    console.log('New item created:', newItem)

    // Use functional update to prevent race conditions when adding multiple items
    setItems(prevItems => [...prevItems, newItem])

    // Store variant attributes for this item
    if (variantAttributes.length > 0) {
      setItemVariantAttributes(prev => {
        const updated = {
          ...prev,
          [newItem.id]: variantAttributes
        }
        console.log('Updated itemVariantAttributes:', updated)
        return updated
      })
    }

    // Success message
    const displayName = variant 
      ? `${product.name} (${variantName})` 
      : product.name
    toast.success(`${displayName} added to purchase order`)
  }

  // Fetch category attributes for an item
  const fetchCategoryAttributesForItem = async (categoryId: string | null, parentCategoryId?: string | null) => {
    console.log('Fetching attributes for:', { categoryId, parentCategoryId })
    try {
      const allAttributes: any[] = []
      
      // Fetch parent category attributes first
      if (parentCategoryId) {
        console.log('Fetching parent category attributes:', parentCategoryId)
        const parentRes = await fetch(`/api/admin/categories/${parentCategoryId}/attributes`)
        console.log('Parent response status:', parentRes.status)
        if (parentRes.ok) {
          const parentData = await parentRes.json()
          console.log('Parent attributes data:', parentData)
          if (parentData.data && Array.isArray(parentData.data)) {
            allAttributes.push(...parentData.data.map((attr: any) => ({ ...attr, fromParent: true })))
          }
        }
      }
      
      // Fetch current category attributes
      if (categoryId) {
        console.log('Fetching category attributes:', categoryId)
        const res = await fetch(`/api/admin/categories/${categoryId}/attributes`)
        console.log('Category response status:', res.status)
        if (res.ok) {
          const data = await res.json()
          console.log('Category attributes data:', data)
          if (data.data && Array.isArray(data.data)) {
            allAttributes.push(...data.data)
          }
        }
      }
      
      console.log('All attributes before filter:', allAttributes)
      
      // Filter to only variant attributes - check isVariant flag OR select/color types
      const variantAttrs = allAttributes.filter((attr: any) => {
        const isVariant = attr.isVariant === true || attr.isVariant === 'true'
        const isSelectOrColor = attr.inputType === 'select' || attr.inputType === 'color'
        return isVariant || isSelectOrColor
      })
      
      // Deduplicate by slug - keep first occurrence (parent attributes come first)
      const uniqueAttrs = variantAttrs.reduce((acc: any[], attr: any) => {
        if (!acc.find(a => a.slug === attr.slug)) {
          acc.push(attr)
        }
        return acc
      }, [])
      
      console.log('Variant attributes after filter and dedup:', uniqueAttrs)
      return uniqueAttrs
    } catch (error) {
      console.error('Error fetching category attributes:', error)
      return []
    }
  }

  const updateItem = (id: string, field: string, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          
          // If updating variant attributes, rebuild variantName
          if (field === 'variantAttributes') {
            const attrs = value || {}
            updated.variantName = Object.entries(attrs)
              .filter(([_, v]) => v) // Only include non-empty values
              .map(([key, val]) => `${key}: ${val}`)
              .join(' • ') || null
          }
          
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice
          }
          return updated
        }
        return item
      })
    )
  }

  // Update a specific variant attribute for an item
  const updateItemVariantAttribute = (itemId: string, attributeSlug: string, value: string) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const newAttributes = {
            ...(item.variantAttributes || {}),
            [attributeSlug]: value
          }
          
          const variantName = Object.entries(newAttributes)
            .filter(([_, v]) => v) // Only include non-empty values
            .map(([key, val]) => `${key}: ${val}`)
            .join(' • ') || null
          
          return {
            ...item,
            variantAttributes: newAttributes,
            variantName
          }
        }
        return item
      })
    )
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
    // Clean up variant attributes for this item
    setItemVariantAttributes(prev => {
      const newAttrs = { ...prev }
      delete newAttrs[id]
      return newAttrs
    })
  }

  // Duplicate item - creates a copy with empty variant values
  const duplicateItem = async (item: POItem) => {
    const variantAttributes = item.availableVariantAttributes || 
      await fetchCategoryAttributesForItem(item.categoryId || null, item.parentCategoryId || null)

    const newItem: POItem = {
      id: crypto.randomUUID(),
      productId: item.productId,
      variantId: null,
      productName: item.productName,
      productSku: item.productSku,
      variantName: null,
      variantAttributes: {}, // Empty variant attributes for user to fill
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      categoryId: item.categoryId,
      parentCategoryId: item.parentCategoryId,
      availableVariantAttributes: variantAttributes,
    }

    setItems(prev => [...prev, newItem])
    
    // Store variant attributes for the new item
    if (variantAttributes.length > 0) {
      setItemVariantAttributes(prev => ({
        ...prev,
        [newItem.id]: variantAttributes
      }))
    }

    toast.success('Item duplicated. Set variant attributes below.')
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
      items: items.map(({ id, availableVariantAttributes, categoryId, parentCategoryId, ...item }) => ({
        ...item,
        // Ensure variantAttributes is null if empty object
        variantAttributes: item.variantAttributes && Object.keys(item.variantAttributes).length > 0 
          ? item.variantAttributes 
          : null,
      })),
    }

    console.log('Submitting purchase order:', JSON.stringify(data, null, 2))
    createPOMutation.mutate(data)
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
            <h1 className="text-3xl font-bold text-[#1a3a5c]">Create Purchase Order</h1>
            <p className="text-gray-500 mt-1">Select products from your catalog to purchase from suppliers</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier & Order Info */}
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
                  {/* Click outside to close */}
                  {isSupplierOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsSupplierOpen(false)}
                    />
                  )}
                </div>
              </div>
<div className="grid grid-cols-1 gap-6">
              <CurrencySelector
                currency={formData.currency}
                onCurrencyChange={(currency) => setFormData({ ...formData, currency })}
                rate={exchangeRate}
                onRateChange={setExchangeRate}
                baseCurrency="USD"
              />
            </div>
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
                    style={{
                      colorScheme: 'light',
                    }}
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
                    style={{
                      colorScheme: 'light',
                    }}
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>Add products from your catalog to this purchase order</CardDescription>
              </div>
              <Button
                type="button"
                onClick={() => setIsProductDialogOpen(true)}
                variant="outline"
                size="sm"
                disabled={productsLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-lg font-medium text-gray-600">No products added yet</p>
                  <p className="text-sm text-gray-500 mt-1">Click "Add Product" to select from your catalog</p>
                </div>
              ) : (
                <>
                  {items.map((item) => {
                    const variantAttrs = itemVariantAttributes[item.id] || item.availableVariantAttributes || []
                    const isExpanded = expandedVariantForms[item.id] !== false // Default to expanded
                    
                    console.log('Rendering item:', item.id, 'variantAttrs:', variantAttrs)
                    
                    return (
                      <div key={item.id} className="p-3 border rounded-lg space-y-2 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base leading-tight">{item.productName}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              SKU: {item.productSku}
                              {item.variantName && (
                                <>
                                  {' • '}
                                  <span className="font-medium text-blue-700">{item.variantName}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {variantAttrs.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setExpandedVariantForms(prev => ({
                                  ...prev,
                                  [item.id]: !isExpanded
                                }))}
                                className="text-gray-600 hover:text-gray-800 h-9 px-2"
                                title={isExpanded ? "Hide variants" : "Show variants"}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateItem(item)}
                              className="text-blue-600 hover:text-blue-700 h-9 px-2.5"
                              title="Duplicate item"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700 h-9 px-2.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Variant Attributes Form Fields */}
                        {isExpanded && variantAttrs.length > 0 ? (
                          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                            <div className="text-xs font-semibold text-blue-900">Variant Attributes</div>
                            <div className="grid grid-cols-4 gap-2">
                              {variantAttrs.map((attr: any) => {
                                let options: string[] = []
                                try {
                                  options = typeof attr.options === 'string'
                                    ? JSON.parse(attr.options)
                                    : Array.isArray(attr.options)
                                    ? attr.options
                                    : []
                                } catch (e) {
                                  options = []
                                }

                                // Use 'type' field instead of 'inputType' if inputType is not available
                                const fieldType = (attr.inputType || attr.type || '').toLowerCase()
                                
                                console.log('Rendering attribute:', attr.name, 'inputType:', attr.inputType, 'type:', attr.type, 'fieldType:', fieldType, 'options:', options)

                                return (
                                  <div key={attr.slug}>
                                    <Label htmlFor={`${item.id}-${attr.slug}`} className="text-xs font-medium mb-1 block">
                                      {attr.name}
                                      {attr.fromParent && <span className="text-[10px] text-blue-600 ml-1">(parent)</span>}
                                    </Label>
                                    
                                    {/* Render different input based on type */}
                                    {fieldType === 'select' && options.length > 0 ? (
                                      <select
                                        id={`${item.id}-${attr.slug}`}
                                        value={item.variantAttributes?.[attr.slug] || ''}
                                        onChange={(e) => updateItemVariantAttribute(item.id, attr.slug, e.target.value)}
                                        className="w-full px-2 py-1.5 border rounded-md text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      >
                                        <option value="">Select {attr.name}</option>
                                        {options.map((option: string) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    ) : fieldType === 'color' ? (
                                      <div className="flex gap-1.5">
                                        <input
                                          type="color"
                                          id={`${item.id}-${attr.slug}`}
                                          value={item.variantAttributes?.[attr.slug] || '#000000'}
                                          onChange={(e) => updateItemVariantAttribute(item.id, attr.slug, e.target.value)}
                                          className="w-10 h-8 border rounded-md cursor-pointer"
                                        />
                                        <Input
                                          type="text"
                                          value={item.variantAttributes?.[attr.slug] || ''}
                                          onChange={(e) => updateItemVariantAttribute(item.id, attr.slug, e.target.value)}
                                          placeholder="#000000"
                                          className="flex-1 text-xs h-8 px-2"
                                        />
                                      </div>
                                    ) : fieldType === 'number' ? (
                                      <Input
                                        type="number"
                                        id={`${item.id}-${attr.slug}`}
                                        value={item.variantAttributes?.[attr.slug] || ''}
                                        onChange={(e) => updateItemVariantAttribute(item.id, attr.slug, e.target.value)}
                                        placeholder={`Enter ${attr.name}`}
                                        className="text-xs h-8 px-2"
                                      />
                                    ) : fieldType === 'textarea' ? (
                                      <Textarea
                                        id={`${item.id}-${attr.slug}`}
                                        value={item.variantAttributes?.[attr.slug] || ''}
                                        onChange={(e) => updateItemVariantAttribute(item.id, attr.slug, e.target.value)}
                                        placeholder={`Enter ${attr.name}`}
                                        className="text-xs px-2 py-1.5"
                                        rows={2}
                                      />
                                    ) : (
                                      // Default to text input for 'text' and any other types
                                      <Input
                                        type="text"
                                        id={`${item.id}-${attr.slug}`}
                                        value={item.variantAttributes?.[attr.slug] || ''}
                                        onChange={(e) => updateItemVariantAttribute(item.id, attr.slug, e.target.value)}
                                        placeholder={`Enter ${attr.name}`}
                                        className="text-xs h-8 px-2"
                                      />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : !isExpanded && variantAttrs.length > 0 ? (
                          <div className="p-2 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600 italic">
                            Variant form hidden (click ↓ to show)
                          </div>
                        ) : (item.categoryId || item.parentCategoryId) && isExpanded ? (
                          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="text-xs text-yellow-800 flex items-center justify-between">
                              <span>No variant attributes found</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="ml-2 h-7 text-xs px-2"
                                onClick={async () => {
                                  const attrs = await fetchCategoryAttributesForItem(item.categoryId || null, item.parentCategoryId || null)
                                  if (attrs.length > 0) {
                                    setItemVariantAttributes(prev => ({
                                      ...prev,
                                      [item.id]: attrs
                                    }))
                                    setItems(prevItems =>
                                      prevItems.map(i =>
                                        i.id === item.id
                                          ? { ...i, availableVariantAttributes: attrs }
                                          : i
                                      )
                                    )
                                    toast.success('Attributes loaded')
                                  } else {
                                    toast.error('No variant attributes available')
                                  }
                                }}
                              >
                                Load Attributes
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                              min="1"
                              className="h-8 text-sm px-2"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Unit Price ({formData.currency})</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                              min="0"
                              className="h-8 text-sm px-2"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Total ({formData.currency})</Label>
                            <div className="text-base font-semibold mt-1.5 text-gray-900">{item.total.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
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
                  onChange={(e) =>
                    setFormData({ ...formData, shippingCost: Number(e.target.value) })
                  }
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
            disabled={createPOMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {createPOMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
          </Button>
        </div>
      </form>

      {/* Product Selection Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Products from Catalog</DialogTitle>
            <DialogDescription>
              Choose products from your registered catalog to add to this purchase order
            </DialogDescription>
          </DialogHeader>
          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1a3a5c] rounded-full animate-spin"></div>
            </div>
          ) : (
            <ProductSearchSelect
              products={products?.data || []}
              onSelect={addProduct}
              onClose={() => setIsProductDialogOpen(false)}
              selectedIds={items.map(i => i.productId)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
