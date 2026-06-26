'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Star, GripVertical, ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  sku: string
  name: string
  price: number
  thumbnail?: string | null
  isFeatured: boolean
  featuredOrder: number
  category?: {
    id: string
    name: string
  } | null
}

export default function FeaturedProductsSettings() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/products/featured')
      const data = await response.json()

      if (data.success) {
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching featured products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentStatus })
      })

      const data = await response.json()
      if (data.success) {
        fetchFeaturedProducts()
      } else {
        alert(data.error || 'Failed to update featured status')
      }
    } catch (error) {
      console.error('Error updating featured status:', error)
      alert('Failed to update featured status')
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

      const response = await fetch('/api/admin/products/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updatedProducts })
      })

      const data = await response.json()
      if (!data.success) {
        alert(data.error || 'Failed to update order')
        fetchFeaturedProducts()
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order')
      fetchFeaturedProducts()
    } finally {
      setDraggedIndex(null)
    }
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
            <Star className="w-8 h-8 text-yellow-500" />
            Featured Products
          </h1>
          <p className="text-gray-600 mt-1">
            Manage which products appear in the Featured Products section on the homepage
          </p>
          <p className="text-sm text-gray-500 mt-1">
            💡 Drag items to reorder • Toggle switches to show/hide • Go to{' '}
            <Link href="/admin/products" className="text-primary-600 hover:underline">
              Products
            </Link>{' '}
            to mark more products as featured
          </p>
        </div>
      </div>

      {/* Featured Products Card */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Products ({products.length})</CardTitle>
          <CardDescription>
            Select and order products to feature on the homepage.
            {products.length === 0 && ' No products are currently featured.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No featured products yet
              </h3>
              <p className="text-gray-600 mb-6">
                Go to Products management and toggle the "Featured" switch to add products here.
              </p>
              <Button
                onClick={() => router.push('/admin/products')}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Go to Products
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 p-4 border rounded-lg bg-white hover:shadow-md transition-shadow cursor-move ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                  
                  <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        📦
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      {product.category && (
                        <>
                          <span className="text-gray-300">•</span>
                          <Badge variant="outline" className="text-xs">
                            {product.category.name}
                          </Badge>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-medium text-primary-600 mt-1">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.isFeatured}
                        onCheckedChange={() => handleToggleFeatured(product.id, product.isFeatured)}
                      />
                      <span className="text-sm text-gray-600">Featured</span>
                    </div>
                    <span className="text-sm text-gray-500 w-16 text-right">
                      Order: {index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📚 How to Manage Featured Products</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">To Add Products:</span>
              <span>Go to Admin → Products → Toggle the "Featured" switch</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">To Reorder:</span>
              <span>Drag and drop products using the grip handle (⋮⋮)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">To Remove:</span>
              <span>Toggle off the "Featured" switch</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Homepage Display:</span>
              <span>Featured products appear in order on the homepage</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
