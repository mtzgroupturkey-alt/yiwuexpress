'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Package, DollarSign, Archive, ArrowLeft } from 'lucide-react'

interface ProductVariant {
  id: string
  sku: string
  attributes: Record<string, string>
  price: number
  comparePrice: number | null
  stock: number
  lowStockThreshold: number
  images: string[]
  isActive: boolean
  tieredPrices: Array<{
    id: string
    minQuantity: number
    maxQuantity: number | null
    price: number
  }>
}

export default function ProductVariantsPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    attributes: {} as Record<string, string>,
    price: '',
    comparePrice: '',
    stock: '0',
    lowStockThreshold: '10',
    images: [] as string[],
    isActive: true
  })

  // Bulk create state
  const [bulkAttributes, setBulkAttributes] = useState<Array<{ name: string; values: string[] }>>([
    { name: '', values: [] }
  ])
  const [bulkBasePrice, setBulkBasePrice] = useState('')
  const [bulkDefaultStock, setBulkDefaultStock] = useState('0')

  useEffect(() => {
    fetchVariants()
  }, [productId])

  const fetchVariants = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch variants')

      const data = await response.json()
      setVariants(data.data || [])
      setProduct(data.product)
      setError('')
    } catch (err) {
      setError('Failed to load variants')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/products/${productId}/variants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
          stock: parseInt(formData.stock),
          lowStockThreshold: parseInt(formData.lowStockThreshold)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create variant')
      }

      await fetchVariants()
      setShowAddForm(false)
      resetForm()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create variant')
    }
  }

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    const validAttributes = bulkAttributes.filter(attr => attr.name && attr.values.length > 0)
    
    if (validAttributes.length === 0) {
      alert('Please add at least one attribute with values')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/products/${productId}/variants/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attributes: validAttributes,
          basePrice: parseFloat(bulkBasePrice),
          defaultStock: parseInt(bulkDefaultStock)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to bulk create variants')
      }

      const result = await response.json()
      alert(`Created ${result.data.created} variants${result.data.errors > 0 ? ` (${result.data.errors} errors)` : ''}`)
      
      await fetchVariants()
      setShowBulkForm(false)
      setBulkAttributes([{ name: '', values: [] }])
      setBulkBasePrice('')
      setBulkDefaultStock('0')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to bulk create variants')
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete variant')
      }

      await fetchVariants()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete variant')
    }
  }

  const resetForm = () => {
    setFormData({
      sku: '',
      attributes: {},
      price: '',
      comparePrice: '',
      stock: '0',
      lowStockThreshold: '10',
      images: [],
      isActive: true
    })
  }

  const addBulkAttribute = () => {
    setBulkAttributes([...bulkAttributes, { name: '', values: [] }])
  }

  const updateBulkAttribute = (index: number, field: 'name' | 'values', value: string | string[]) => {
    const updated = [...bulkAttributes]
    updated[index] = { ...updated[index], [field]: value }
    setBulkAttributes(updated)
  }

  const removeBulkAttribute = (index: number) => {
    setBulkAttributes(bulkAttributes.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3a5c] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading variants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/products')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">Product Variants</h1>
        {product && (
          <p className="text-gray-600 mt-2">
            Managing variants for: <span className="font-semibold">{product.name}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Single Variant
        </Button>
        <Button onClick={() => setShowBulkForm(true)} variant="outline">
          <Package className="w-4 h-4 mr-2" />
          Bulk Create Variants
        </Button>
      </div>

      {/* Add Single Variant Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Variant</CardTitle>
            <CardDescription>Create a single product variant</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateVariant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="comparePrice">Compare Price</Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Variant</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddForm(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bulk Create Form */}
      {showBulkForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bulk Create Variants</CardTitle>
            <CardDescription>
              Create multiple variants from attribute combinations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBulkCreate} className="space-y-4">
              <div>
                <Label>Attributes</Label>
                {bulkAttributes.map((attr, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      placeholder="Attribute name (e.g., Color)"
                      value={attr.name}
                      onChange={(e) => updateBulkAttribute(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Values (comma-separated, e.g., Red, Blue, Green)"
                      value={attr.values.join(', ')}
                      onChange={(e) => updateBulkAttribute(index, 'values', e.target.value.split(',').map(v => v.trim()))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeBulkAttribute(index)}
                      disabled={bulkAttributes.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addBulkAttribute} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Attribute
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bulkBasePrice">Base Price *</Label>
                  <Input
                    id="bulkBasePrice"
                    type="number"
                    step="0.01"
                    value={bulkBasePrice}
                    onChange={(e) => setBulkBasePrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bulkDefaultStock">Default Stock</Label>
                  <Input
                    id="bulkDefaultStock"
                    type="number"
                    value={bulkDefaultStock}
                    onChange={(e) => setBulkDefaultStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Variants</Button>
                <Button type="button" variant="outline" onClick={() => setShowBulkForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Variants List */}
      <div className="grid gap-4">
        {variants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No variants yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Create variants to offer different options for this product
              </p>
            </CardContent>
          </Card>
        ) : (
          variants.map((variant) => (
            <Card key={variant.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{variant.sku}</h3>
                      <Badge variant={variant.isActive ? 'default' : 'secondary'}>
                        {variant.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {variant.stock === 0 && (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                      {variant.stock > 0 && variant.stock <= variant.lowStockThreshold && (
                        <Badge className="bg-yellow-500">Low Stock</Badge>
                      )}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(variant.attributes).map(([key, value]) => (
                        <span key={key} className="text-sm bg-gray-100 px-2 py-1 rounded">
                          <span className="font-medium">{key}:</span> {value as string}
                        </span>
                      ))}
                    </div>

                    <div className="mt-2 flex gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${variant.price.toFixed(2)}
                        {variant.comparePrice && (
                          <span className="line-through text-gray-400 ml-1">
                            ${variant.comparePrice.toFixed(2)}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Archive className="w-4 h-4" />
                        {variant.stock} in stock
                      </span>
                    </div>

                    {variant.tieredPrices.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">
                          {variant.tieredPrices.length} tiered price{variant.tieredPrices.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/products/${productId}/variants/${variant.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteVariant(variant.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
