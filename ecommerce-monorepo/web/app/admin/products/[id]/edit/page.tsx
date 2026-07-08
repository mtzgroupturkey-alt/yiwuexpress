'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { ProductAttributesSection } from '@/components/admin/ProductAttributesSection'
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'
import { ProductMediaUpload } from '@/components/admin/ProductMediaUpload'

interface MediaItem {
  url: string
  type: 'image' | 'video'
}

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  compareAtPrice: z.number().optional(),
  costPrice: z.number().optional(),
  stock: z.number().int().min(0, 'Stock must be positive'),
  lowStockThreshold: z.number().int().min(0).default(10),
  thumbnail: z.string().optional(),
  weightKg: z.number().min(0, 'Weight is required'),
  hsCode: z.string().optional(),
  countryOfOrigin: z.string().default('China'),
  material: z.string().optional(),
  minOrderQty: z.number().int().min(1).default(1),
  wholesalePrice: z.number().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  flashSalePrice: z.number().optional(),
  flashSaleStart: z.string().optional(),
  flashSaleEnd: z.string().optional(),
  flashSaleStock: z.number().int().optional(),
  fragile: z.boolean().default(false),
  exportRestricted: z.boolean().default(false),
  dangerousGoods: z.boolean().default(false),
  batteryIncluded: z.boolean().default(false)
})

type ProductForm = z.input<typeof productSchema>

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema)
  })

  const selectedCategoryId = watch('categoryId')

  useEffect(() => {
    fetchCategories()
    fetchProduct()
  }, [params.id])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      console.log('Edit page - Fetched categories data:', data)
      if (data.success) {
        setCategories(data.data || [])
        console.log('Edit page - Set categories:', data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${params.id}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const product = data.data
        
        // Reset form with product data
        reset({
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          categoryId: product.categoryId || '',
          price: product.price,
          compareAtPrice: product.compareAtPrice || undefined,
          costPrice: product.costPrice || undefined,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          weightKg: product.weightKg,
          hsCode: product.hsCode || '',
          countryOfOrigin: product.countryOfOrigin,
          material: product.material || '',
          minOrderQty: product.minOrderQty,
          wholesalePrice: product.wholesalePrice || undefined,
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || '',
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          isFlashSale: product.isFlashSale,
          flashSalePrice: product.flashSalePrice || undefined,
          flashSaleStart: product.flashSaleStart ? new Date(product.flashSaleStart).toISOString().slice(0, 16) : undefined,
          flashSaleEnd: product.flashSaleEnd ? new Date(product.flashSaleEnd).toISOString().slice(0, 16) : undefined,
          flashSaleStock: product.flashSaleStock || undefined,
          fragile: product.fragile,
          exportRestricted: product.exportRestricted,
          dangerousGoods: product.dangerousGoods,
          batteryIncluded: product.batteryIncluded
        })

        // Set media (images and videos)
        const mediaItems: MediaItem[] = []
        
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
          product.images.forEach((url: string) => {
            mediaItems.push({ url, type: 'image' })
          })
        }
        
        if (product.videos && Array.isArray(product.videos) && product.videos.length > 0) {
          product.videos.forEach((url: string) => {
            mediaItems.push({ url, type: 'video' })
          })
        }
        
        setMedia(mediaItems)

        // Set attribute values if they exist
        if (product.attributes) {
          setAttributeValues(product.attributes)
        }
      } else {
        alert('Product not found')
        router.push('/admin/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      alert('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProductForm) => {
    setSubmitting(true)
    try {
      // Separate images and videos
      const images = media.filter(m => m.type === 'image').map(m => m.url)
      const videos = media.filter(m => m.type === 'video').map(m => m.url)

      const productData = {
        ...data,
        images,
        videos,
        thumbnail: images[0] || null,
        price: parseFloat(data.price.toString()),
        compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice.toString()) : null,
        costPrice: data.costPrice ? parseFloat(data.costPrice.toString()) : null,
        wholesalePrice: data.wholesalePrice ? parseFloat(data.wholesalePrice.toString()) : null,
        weightKg: parseFloat(data.weightKg.toString()),
        stock: parseInt(data.stock.toString()),
        lowStockThreshold: parseInt((data.lowStockThreshold ?? 10).toString()),
        minOrderQty: parseInt((data.minOrderQty ?? 1).toString()),
        isFlashSale: data.isFlashSale,
        flashSalePrice: data.flashSalePrice ? parseFloat(data.flashSalePrice.toString()) : null,
        flashSaleStart: data.flashSaleStart ? new Date(data.flashSaleStart).toISOString() : null,
        flashSaleEnd: data.flashSaleEnd ? new Date(data.flashSaleEnd).toISOString() : null,
        flashSaleStock: data.flashSaleStock ? parseInt(data.flashSaleStock.toString()) : null,
        attributes: attributeValues // Include attribute values
      }

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      const result = await response.json()

      if (result.success) {
        alert('Product updated successfully!')
        router.push('/admin/products')
      } else {
        alert(result.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        alert('Product deleted successfully!')
        router.push('/admin/products')
      } else {
        alert(result.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/products')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600">Update product information</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {deleting ? 'Deleting...' : 'Delete Product'}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU *</Label>
                    <Input id="sku" {...register('sku')} />
                    {errors.sku && (
                      <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="categoryId">Category</Label>
                    <CategoryDropdown
                      categories={categories}
                      value={selectedCategoryId}
                      onChange={(value) => setValue('categoryId', value || '')}
                      placeholder="Select a category..."
                      searchPlaceholder="Search categories..."
                      clearable
                      showPath
                      showLevelIndicator
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input id="slug" {...register('slug')} />
                  {errors.slug && (
                    <p className="text-red-600 text-sm mt-1">{errors.slug.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Attributes */}
            <ProductAttributesSection
              categoryId={selectedCategoryId}
              initialValues={attributeValues}
              onChange={setAttributeValues}
            />

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...register('price', { valueAsNumber: true })}
                    />
                    {errors.price && (
                      <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="compareAtPrice">Compare at Price ($)</Label>
                    <Input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      {...register('compareAtPrice', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="costPrice">Cost Price ($)</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      {...register('costPrice', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wholesalePrice">Wholesale Price ($)</Label>
                    <Input
                      id="wholesalePrice"
                      type="number"
                      step="0.01"
                      {...register('wholesalePrice', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minOrderQty">Min Order Quantity</Label>
                    <Input
                      id="minOrderQty"
                      type="number"
                      {...register('minOrderQty', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      {...register('stock', { valueAsNumber: true })}
                    />
                    {errors.stock && (
                      <p className="text-red-600 text-sm mt-1">{errors.stock.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      {...register('lowStockThreshold', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance & Shipping */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance & Shipping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weightKg">Weight (kg) *</Label>
                    <Input
                      id="weightKg"
                      type="number"
                      step="0.01"
                      {...register('weightKg', { valueAsNumber: true })}
                    />
                    {errors.weightKg && (
                      <p className="text-red-600 text-sm mt-1">{errors.weightKg.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="hsCode">HS Code</Label>
                    <Input id="hsCode" {...register('hsCode')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="countryOfOrigin">Country of Origin</Label>
                    <Input id="countryOfOrigin" {...register('countryOfOrigin')} />
                  </div>
                  <div>
                    <Label htmlFor="material">Material</Label>
                    <Input id="material" {...register('material')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('fragile')} className="w-4 h-4" />
                    <span className="text-sm">Fragile</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('exportRestricted')} className="w-4 h-4" />
                    <span className="text-sm">Export Restricted</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('dangerousGoods')} className="w-4 h-4" />
                    <span className="text-sm">Dangerous Goods</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('batteryIncluded')} className="w-4 h-4" />
                    <span className="text-sm">Battery Included</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Images & Videos */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images & Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductMediaUpload
                  media={media}
                  onChange={setMedia}
                  maxItems={15}
                />
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input id="metaTitle" {...register('metaTitle')} />
                </div>
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <textarea
                    id="metaDescription"
                    {...register('metaDescription')}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('isActive')} className="w-4 h-4" />
                  <span className="text-sm font-medium">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('isFeatured')} className="w-4 h-4" />
                  <span className="text-sm font-medium">Featured</span>
                </label>
              </CardContent>
            </Card>

            {/* Flash Sale */}
            <Card>
              <CardHeader>
                <CardTitle>Flash Sale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('isFlashSale')} className="w-4 h-4" />
                  <span className="text-sm font-medium">Enable Flash Sale</span>
                </label>
                {watch('isFlashSale') && (
                  <>
                    <div>
                      <Label htmlFor="flashSalePrice">Flash Sale Price ($)</Label>
                      <Input
                        id="flashSalePrice"
                        type="number"
                        step="0.01"
                        {...register('flashSalePrice', { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="flashSaleStart">Start Date</Label>
                      <Input
                        id="flashSaleStart"
                        type="datetime-local"
                        {...register('flashSaleStart')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="flashSaleEnd">End Date</Label>
                      <Input
                        id="flashSaleEnd"
                        type="datetime-local"
                        {...register('flashSaleEnd')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="flashSaleStock">Flash Sale Stock</Label>
                      <Input
                        id="flashSaleStock"
                        type="number"
                        {...register('flashSaleStock', { valueAsNumber: true })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button type="submit" className="w-full" disabled={submitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {submitting ? 'Updating...' : 'Update Product'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/products')}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
