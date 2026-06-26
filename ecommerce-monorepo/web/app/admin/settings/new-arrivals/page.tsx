'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Sparkles, GripVertical, ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  sku: string
  name: string
  price: number
  thumbnail?: string | null
  isNewArrival: boolean
  newArrivalOrder: number
  category?: {
    id: string
    name: string
  } | null
}

export default function NewArrivalsSettings() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchNewArrivals()
  }, [])

  const fetchNewArrivals = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/products/new-arrivals')
      const data = await response.json()

      if (data.success) {
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching new arrivals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleNewArrival = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/new-arrival`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isNewArrival: !currentStatus })
      })

      const data = await response.json()
      if (data.success) {
        fetchNewArrivals()
      } else {
        alert(data.error || 'Failed to update new arrival status')
      }
    } catch (error) {
      console.error('Error updating new arrival status:', error)
      alert('Failed to update new arrival status')
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

      const response = await fetch('/api/admin/products/new-arrivals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updatedProducts })
      })

      const data = await response.json()
      if (!data.success) {
        alert(data.error || 'Failed to update order')
        fetchNewArrivals()
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order')
      fetchNewArrivals()
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
            <Sparkles className="w-8 h-8 text-blue-500" />
            New Arrivals
          </h1>
          <p className="text-gray-600 mt-1">
            Manage which products appear in the New Arrivals section on the homepage
          </p>
          <p className="text-sm text-gray-500 mt-1">
            💡 Drag items to reorder • Toggle switches to show/hide • Go to{' '}
            <Link href="/admin/products" className="text-primary-600 hover:underline">
              Products
            </Link>{' '}
            to mark more products as new arrivals
          </p>
        </div>
      </div>

      {/* New Arrivals Card */}
      <Card>
        <CardHeader>
          <CardTitle>New Arrivals ({products.length})</CardTitle>
          <CardDescription>
            Select and order products to showcase as new arrivals on the homepage.
            {products.length === 0 && ' No products are currently marked as new arrivals.'}
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
                No new arrivals yet
              </h3>
              <p className="text-gray-600 mb-6">
                Go to Products management and toggle the "New Arrival" switch to add products here.
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
                        checked={product.isNewArrival}
                        onCheckedChange={() => handleToggleNewArrival(product.id, product.isNewArrival)}
                      />
                      <span className="text-sm text-gray-600">New Arrival</span>
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
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-purple-900 mb-2">📚 How to Manage New Arrivals</h3>
          <ul className="space-y-2 text-sm text-purple-800">
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">To Add Products:</span>
              <span>Go to Admin → Products → Toggle the "New Arrival" switch</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">To Reorder:</span>
              <span>Drag and drop products using the grip handle (⋮⋮)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">To Remove:</span>
              <span>Toggle off the "New Arrival" switch</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">Homepage Display:</span>
              <span>New arrivals appear in order on the homepage</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
