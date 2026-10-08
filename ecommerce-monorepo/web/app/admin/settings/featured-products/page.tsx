'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Star, GripVertical, ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'
import { normalizeProductImageUrl, DEFAULT_PLACEHOLDER } from '@/lib/image-utils'

const DEFAULT_PRODUCT_IMAGE = DEFAULT_PLACEHOLDER || '/images/product-placeholder.webp'
const INLINE_FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Cpath d='M160 180a20 20 0 100-40 20 20 0 000 40zm80 70H160l40-50 25 31 15-18 40 37z' fill='%23cbd5e1'/%3E%3Ctext x='200' y='290' text-anchor='middle' fill='%2394a3b8' font-family='system-ui, sans-serif' font-size='16' font-weight='500'%3ENo Photo%3C/text%3E%3C/svg%3E"

function FeaturedProductPhoto({
  src,
  alt,
  category,
  name,
  className = '',
}: {
  src?: string | null
  alt: string
  category?: string | null
  name?: string
  className?: string
}) {
  const resolved = src ? normalizeProductImageUrl(src, category, name) : DEFAULT_PRODUCT_IMAGE
  const [imgSrc, setImgSrc] = useState<string>(resolved)

  useEffect(() => {
    setImgSrc(src ? normalizeProductImageUrl(src, category, name) : DEFAULT_PRODUCT_IMAGE)
  }, [src, category, name])

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`w-full h-full object-cover ${className}`}
      onError={() => {
        setImgSrc((current) => (current !== DEFAULT_PRODUCT_IMAGE ? DEFAULT_PRODUCT_IMAGE : INLINE_FALLBACK_SVG))
      }}
    />
  )
}

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
  const { dict } = useAdminLocale()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkProcessing, setBulkProcessing] = useState(false)

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
        setSelectedIds([])
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

  // Checkbox selection helpers
  const toggleSelectAll = () => {
    if (products.length === 0) return
    if (selectedIds.length === products.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(products.map(p => p.id))
    }
  }

  const selectAll = () => {
    setSelectedIds(products.map(p => p.id))
  }

  const deselectAll = () => {
    setSelectedIds([])
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Bulk toggle action via /api/admin/products/bulk
  const handleBulkToggle = async (targetIds: string[], setFeatured: boolean) => {
    if (targetIds.length === 0) return
    const actionLabel = setFeatured ? 'enable' : 'disable'
    const confirmMsg = `Are you sure you want to ${actionLabel} featured status for ${targetIds.length} product${targetIds.length > 1 ? 's' : ''}?`
    if (!confirm(confirmMsg)) return

    setBulkProcessing(true)
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ids: targetIds,
          action: 'TOGGLE_FEATURED',
          isFeatured: setFeatured,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedIds([])
        fetchFeaturedProducts()
      } else {
        alert(data.error || 'Failed to process bulk action')
      }
    } catch (err) {
      console.error('Bulk featured action error:', err)
      alert('Network error')
    } finally {
      setBulkProcessing(false)
    }
  }

  const allSelected = products.length > 0 && selectedIds.length === products.length
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < products.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/settings')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {dict.common.back}
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-8 h-8 text-yellow-500" />
            {dict.settings.featuredProducts}
          </h1>
          <p className="text-gray-600 mt-1">
            {dict.settings.featuredProductsDesc}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            💡 {dict.settings.featuredProductsHelp}
          </p>
        </div>

        {/* Global Total On / Off Buttons */}
        {products.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulkProcessing || loading}
              onClick={() => handleBulkToggle(products.map(p => p.id), false)}
              className="text-xs font-semibold rounded-xl text-rose-700 bg-white border-rose-200 hover:bg-rose-50 hover:text-rose-800 shadow-2xs"
              title="Turn OFF featured badge for all products in this list"
            >
              Turn All Off ({products.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulkProcessing || loading}
              onClick={() => handleBulkToggle(products.map(p => p.id), true)}
              className="text-xs font-semibold rounded-xl text-emerald-700 bg-white border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 shadow-2xs"
              title="Ensure all products in this list have featured turned on"
            >
              Turn All On ({products.length})
            </Button>
          </div>
        )}
      </div>

      {/* Featured Products Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle>{dict.settings.featuredProducts} ({products.length})</CardTitle>
              <CardDescription>
                {dict.settings.featuredProductsDesc}
              </CardDescription>
            </div>

            {/* Selection & Bulk Actions Bar */}
            {products.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
                  <input
                    type="checkbox"
                    id="selectAllFeatured"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartiallySelected
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="selectAllFeatured" className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                    Select All
                  </label>
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-xs text-gray-500 hover:text-gray-900 underline ml-1"
                    >
                      Deselect ({selectedIds.length})
                    </button>
                  )}
                </div>

                {/* Bulk Action Controls when 1 or more are selected */}
                {selectedIds.length > 0 ? (
                  <div className="flex items-center gap-2 animate-in fade-in duration-150">
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                      {selectedIds.length} selected
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      disabled={bulkProcessing}
                      onClick={() => handleBulkToggle(selectedIds, true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-8 px-3 font-semibold shadow-2xs"
                    >
                      Set On ({selectedIds.length})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={bulkProcessing}
                      onClick={() => handleBulkToggle(selectedIds, false)}
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs h-8 px-3 font-semibold shadow-2xs"
                    >
                      Set Off ({selectedIds.length})
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>Use checkboxes to select items for batch toggle</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {dict.settings.noFeaturedProducts}
              </h3>
              <p className="text-gray-600 mb-6">
                {dict.settings.noFeaturedProductsHelp}
              </p>
              <Button
                onClick={() => router.push('/admin/products')}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {dict.settings.goToProducts}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product, index) => {
                const isSelected = selectedIds.includes(product.id)
                return (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-4 p-4 border rounded-2xl bg-white hover:shadow-md transition-all cursor-move ${
                      draggedIndex === index ? 'opacity-50' : ''
                    } ${isSelected ? 'border-blue-400 bg-blue-50/20 ring-1 ring-blue-300' : 'border-gray-200'}`}
                  >
                    {/* Item Selection Checkbox */}
                    <div
                      className="flex items-center shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(product.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title={`Select ${product.name}`}
                      />
                    </div>

                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing shrink-0" />
                    
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                      <FeaturedProductPhoto
                        src={product.thumbnail}
                        alt={product.name}
                        category={product.category?.name}
                        name={product.name}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        {product.category && (
                          <>
                            <span className="text-gray-300">•</span>
                            <Badge variant="outline" className="text-[11px] font-medium">
                              {product.category.name}
                            </Badge>
                          </>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#1a3a5c] mt-1">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.isFeatured}
                          onCheckedChange={() => handleToggleFeatured(product.id, product.isFeatured)}
                        />
                        <span className={`text-xs font-semibold ${product.isFeatured ? 'text-emerald-700' : 'text-gray-400'}`}>
                          {product.isFeatured ? 'Featured (ON)' : 'Off'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 w-16 text-right font-medium">
                        Order: {index + 1}
                      </span>
                    </div>
                  </div>
                )
              })}
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
