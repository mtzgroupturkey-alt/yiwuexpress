'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Zap, GripVertical, ArrowLeft, Package, Clock, DollarSign, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  sku: string
  name: string
  price: number
  thumbnail?: string | null
  isFlashSale: boolean
  flashSaleOrder: number
  flashSalePrice: number | null
  flashSaleStart: string | null
  flashSaleEnd: string | null
  flashSaleStock: number | null
  stock: number
  category?: {
    id: string
    name: string
  } | null
}

export default function FlashSalesSettings() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    flashSalePrice: string
    flashSaleStart: string
    flashSaleEnd: string
    flashSaleStock: string
  }>({
    flashSalePrice: '',
    flashSaleStart: '',
    flashSaleEnd: '',
    flashSaleStock: '',
  })

  useEffect(() => {
    fetchFlashSaleProducts()
  }, [])

  const fetchFlashSaleProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/products/flash-sales')
      const data = await response.json()

      if (data.success) {
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching flash sale products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFlashSale = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/flash-sale`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlashSale: !currentStatus })
      })

      const data = await response.json()
      if (data.success) {
        fetchFlashSaleProducts()
      } else {
        alert(data.error || 'Failed to update flash sale status')
      }
    } catch (error) {
      console.error('Error updating flash sale status:', error)
      alert('Failed to update flash sale status')
    }
  }

  const handleEditClick = (product: Product) => {
    setEditingId(product.id)
    setEditData({
      flashSalePrice: product.flashSalePrice?.toString() || product.price.toString(),
      flashSaleStart: product.flashSaleStart 
        ? new Date(product.flashSaleStart).toISOString().slice(0, 16) 
        : '',
      flashSaleEnd: product.flashSaleEnd 
        ? new Date(product.flashSaleEnd).toISOString().slice(0, 16) 
        : '',
      flashSaleStock: product.flashSaleStock?.toString() || '',
    })
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/flash-sale`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFlashSale: true,
          flashSalePrice: parseFloat(editData.flashSalePrice),
          flashSaleStart: editData.flashSaleStart,
          flashSaleEnd: editData.flashSaleEnd,
          flashSaleStock: editData.flashSaleStock ? parseInt(editData.flashSaleStock) : null,
        })
      })

      const data = await response.json()
      if (data.success) {
        setEditingId(null)
        fetchFlashSaleProducts()
      } else {
        alert(data.error || 'Failed to update flash sale details')
      }
    } catch (error) {
      console.error('Error updating flash sale details:', error)
      alert('Failed to update flash sale details')
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newProducts = [...products]
    const draggedItem = newProducts[draggedIndex]
    newProducts.splice(draggedIndex, 1)
    newProducts.splice(index, 0, draggedItem)

    setProducts(newProducts)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return

    try {
      const updatedProducts = products.map((product, index) => ({
        id: product.id,
        order: index,
      }))

      const response = await fetch('/api/admin/products/flash-sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updatedProducts })
      })

      const data = await response.json()
      if (!data.success) {
        alert(data.error || 'Failed to update order')
        fetchFlashSaleProducts()
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order')
      fetchFlashSaleProducts()
    } finally {
      setDraggedIndex(null)
    }
  }

  const getFlashSaleStatus = (product: Product) => {
    if (!product.flashSaleStart || !product.flashSaleEnd) return 'Not Configured'
    
    const now = new Date()
    const start = new Date(product.flashSaleStart)
    const end = new Date(product.flashSaleEnd)

    if (now < start) return 'Scheduled'
    if (now > end) return 'Ended'
    return 'Active'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Scheduled': return 'bg-blue-100 text-blue-800'
      case 'Ended': return 'bg-gray-100 text-gray-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateDiscount = (originalPrice: number, salePrice: number) => {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/settings')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-8 h-8 text-orange-500" />
            Flash Sales
          </h1>
          <p className="text-gray-600 mt-1">
            Manage time-limited special offers for mobile app users
          </p>
          <p className="text-sm text-gray-500 mt-1">
            💡 Drag items to reorder • Toggle switches to enable/disable • Go to{' '}
            <Link href="/admin/products" className="text-primary-600 hover:underline">
              Products
            </Link>{' '}
            to add more flash sale products
          </p>
        </div>
      </div>

      {/* Flash Sales Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Flash Sale Products ({products.length})
          </CardTitle>
          <CardDescription>
            Products currently configured for flash sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No flash sale products configured</p>
              <p className="text-sm text-gray-500 mb-4">
                Go to Products page and enable flash sale for products you want to feature
              </p>
              <Button onClick={() => router.push('/admin/products')}>
                Go to Products
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product, index) => {
                const status = getFlashSaleStatus(product)
                const isEditing = editingId === product.id
                
                return (
                  <div
                    key={product.id}
                    draggable={!isEditing}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`
                      flex flex-col md:flex-row items-start gap-4 p-4 bg-white border rounded-lg
                      transition-all ${!isEditing ? 'hover:shadow-md cursor-move' : ''}
                      ${draggedIndex === index ? 'opacity-50' : ''}
                    `}
                  >
                    {/* Drag Handle */}
                    {!isEditing && (
                      <div className="flex items-center">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>
                    )}

                    {/* Product Image */}
                    <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt={product.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                          {product.category && (
                            <p className="text-xs text-gray-500">{product.category.name}</p>
                          )}
                        </div>
                        <Badge className={getStatusColor(status)}>{status}</Badge>
                      </div>

                      {!isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Original Price</p>
                              <p className="font-medium">${product.price.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-500">Flash Price</p>
                              <p className="font-medium text-orange-600">
                                ${product.flashSalePrice?.toFixed(2) || 'Not set'}
                                {product.flashSalePrice && (
                                  <span className="ml-1 text-xs text-green-600">
                                    (-{calculateDiscount(product.price, product.flashSalePrice)}%)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Start</p>
                              <p className="font-medium text-xs">{formatDateTime(product.flashSaleStart)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">End</p>
                              <p className="font-medium text-xs">{formatDateTime(product.flashSaleEnd)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Flash Stock</p>
                              <p className="font-medium">
                                {product.flashSaleStock !== null ? product.flashSaleStock : 'Unlimited'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Total Stock</p>
                              <p className="font-medium">{product.stock}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">
                              Flash Sale Price *
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editData.flashSalePrice}
                              onChange={(e) => setEditData({ ...editData, flashSalePrice: e.target.value })}
                              placeholder="Sale price"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">
                              Flash Sale Stock (optional)
                            </label>
                            <Input
                              type="number"
                              value={editData.flashSaleStock}
                              onChange={(e) => setEditData({ ...editData, flashSaleStock: e.target.value })}
                              placeholder="Leave empty for unlimited"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">
                              Start Date & Time *
                            </label>
                            <Input
                              type="datetime-local"
                              value={editData.flashSaleStart}
                              onChange={(e) => setEditData({ ...editData, flashSaleStart: e.target.value })}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">
                              End Date & Time *
                            </label>
                            <Input
                              type="datetime-local"
                              value={editData.flashSaleEnd}
                              onChange={(e) => setEditData({ ...editData, flashSaleEnd: e.target.value })}
                              className="h-9"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(product)}
                          >
                            Edit
                          </Button>
                          <Switch
                            checked={product.isFlashSale}
                            onCheckedChange={() => handleToggleFlashSale(product.id, product.isFlashSale)}
                          />
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(product.id)}
                          >
                            Save
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
