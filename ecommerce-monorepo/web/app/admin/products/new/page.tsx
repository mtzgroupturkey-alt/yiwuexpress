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
import { ArrowLeft, Save } from 'lucide-react'
import { ProductAttributesSection, validateRequiredAttributes } from '@/components/admin/ProductAttributesSection'
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'
import { ProductMediaUpload } from '@/components/admin/ProductMediaUpload'
import {
  ProductTranslationForm,
  validateTranslations,
  type TranslationPayload
} from '@/components/admin/ProductTranslationForm'

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

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [translations, setTranslations] = useState<TranslationPayload>({
    en: { name: '', description: '' },
    ru: { name: '', description: '' },
    zh: { name: '', description: '' }
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      countryOfOrigin: 'China',
      stock: 0,
      lowStockThreshold: 10,
      minOrderQty: 1,
      isActive: true,
      isFeatured: false,
      isFlashSale: false,
      fragile: false,
      exportRestricted: false,
      dangerousGoods: false,
      batteryIncluded: false
    }
  })

  const selectedCategoryId = watch('categoryId')

  useEffect(() => {
    fetchCategories()
  }, [])

  // Auto-generate slug from the English (default) translation name
  const enName = translations.en.name
  useEffect(() => {
    if (enName) {
      const slug = enName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setValue('slug', slug)
    }
  }, [enName, setValue])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      console.log('Fetched categories data:', data)
      if (data.success) {
        setCategories(data.data || [])
        console.log('Set categories:', data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const onSubmit = async (data: ProductForm) => {
    setSubmitting(true)
    try {
      // Validate translations: English name is mandatory.
      if (!validateTranslations(translations).valid) {
        alert(validateTranslations(translations).error || 'English (EN) translation name is required.')
        setSubmitting(false)
        return
      }

      // Separate images and videos
      const images = media.filter(m => m.type === 'image').map(m => m.url)
      const videos = media.filter(m => m.type === 'video').map(m => m.url)

      const productData = {
        ...data,
        // Dual-write: legacy name/description stay in sync with 'en' translation
        // (Phase 1 design) so reads that haven't migrated still work.
        name: translations.en.name,
        description: translations.en.description || null,
        translations,
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
        attributes: attributeValues // Add attribute values to product data
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      const result = await response.json()

      if (result.success) {
        alert('Product created successfully!')
        router.push('/admin/products')
      } else {
        alert(result.error || 'Failed to create product')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Failed to create product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Modern Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <button onClick={() => router.push('/admin/products')} className="hover:text-[#1a3a5c] transition-colors">Products</button>
            <span>/</span>
            <span className="text-gray-900 font-medium">New</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a3a5c]">Add New Product</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => router.push('/admin/products')}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)} 
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] text-white hover:opacity-90 transition-opacity"
          >
            <Save className="w-4 h-4 mr-2" />
            {submitting ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-xs font-bold text-gray-700 uppercase tracking-wider">SKU *</Label>
                  <Input id="sku" {...register('sku')} className="rounded-xl bg-gray-50/50 focus:bg-white transition-colors" />
                  {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Category</Label>
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

              <div className="space-y-2">
                <Label htmlFor="name" className="sr-only">Product Name *</Label>
                <ProductTranslationForm
                  disabled={submitting}
                  initialValues={translations}
                  onChange={setTranslations}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Slug *</Label>
                <Input id="slug" {...register('slug')} className="rounded-xl bg-gray-50/50 focus:bg-white transition-colors" />
                {errors.slug && <p className="text-red-600 text-sm mt-1">{errors.slug.message}</p>}
              </div>
            </div>

            {/* Dynamic Attributes */}
            <ProductAttributesSection
              categoryId={selectedCategoryId}
              initialValues={attributeValues}
              onChange={setAttributeValues}
            />

            {/* Pricing */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Price ($) *</Label>
                  <Input id="price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} className="rounded-xl" />
                  {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Compare at Price ($)</Label>
                  <Input id="compareAtPrice" type="number" step="0.01" {...register('compareAtPrice', { valueAsNumber: true })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cost Price ($)</Label>
                  <Input id="costPrice" type="number" step="0.01" {...register('costPrice', { valueAsNumber: true })} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="wholesalePrice" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Wholesale Price ($)</Label>
                  <Input id="wholesalePrice" type="number" step="0.01" {...register('wholesalePrice', { valueAsNumber: true })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOrderQty" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Min Order Quantity</Label>
                  <Input id="minOrderQty" type="number" {...register('minOrderQty', { valueAsNumber: true })} className="rounded-xl" />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">Inventory</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Stock Quantity *</Label>
                  <Input id="stock" type="number" {...register('stock', { valueAsNumber: true })} className="rounded-xl" />
                  {errors.stock && <p className="text-red-600 text-sm mt-1">{errors.stock.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Low Stock Threshold</Label>
                  <Input id="lowStockThreshold" type="number" {...register('lowStockThreshold', { valueAsNumber: true })} className="rounded-xl" />
                </div>
              </div>
            </div>

            {/* Compliance & Shipping */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">Compliance & Shipping</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="weightKg" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Weight (kg) *</Label>
                  <Input id="weightKg" type="number" step="0.01" {...register('weightKg', { valueAsNumber: true })} className="rounded-xl" />
                  {errors.weightKg && <p className="text-red-600 text-sm mt-1">{errors.weightKg.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsCode" className="text-xs font-bold text-gray-700 uppercase tracking-wider">HS Code</Label>
                  <Input id="hsCode" {...register('hsCode')} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="countryOfOrigin" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Country of Origin</Label>
                  <Input id="countryOfOrigin" {...register('countryOfOrigin')} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Material</Label>
                  <Input id="material" {...register('material')} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register('fragile')} className="w-4 h-4 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                  <span className="text-sm font-medium group-hover:text-gray-900">Fragile</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register('exportRestricted')} className="w-4 h-4 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                  <span className="text-sm font-medium group-hover:text-gray-900">Export Restricted</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register('dangerousGoods')} className="w-4 h-4 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                  <span className="text-sm font-medium group-hover:text-gray-900">Dangerous Goods</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register('batteryIncluded')} className="w-4 h-4 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                  <span className="text-sm font-medium group-hover:text-gray-900">Battery Included</span>
                </label>
              </div>
            </div>

            {/* Images & Videos */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">Product Images & Videos</h2>
              <ProductMediaUpload
                media={media}
                onChange={setMedia}
                maxItems={15}
              />
            </div>

            {/* SEO */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">SEO</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Meta Title</Label>
                  <Input id="metaTitle" {...register('metaTitle')} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Meta Description</Label>
                  <textarea
                    id="metaDescription"
                    {...register('metaDescription')}
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">Status</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" {...register('isActive')} className="w-5 h-5 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                  <span className="text-sm font-medium group-hover:text-gray-900">Active (Visible)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" {...register('isFeatured')} className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500" />
                  <span className="text-sm font-medium group-hover:text-gray-900">Featured</span>
                </label>
              </div>
            </div>

            {/* Flash Sale */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">Flash Sale</h2>
              <label className="flex items-center gap-3 cursor-pointer group mb-4">
                <input type="checkbox" {...register('isFlashSale')} className="w-5 h-5 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                <span className="text-sm font-medium group-hover:text-gray-900">Enable Flash Sale</span>
              </label>
              
              {watch('isFlashSale') && (
                <div className="space-y-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="space-y-2">
                    <Label htmlFor="flashSalePrice" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Flash Sale Price ($)</Label>
                    <Input id="flashSalePrice" type="number" step="0.01" {...register('flashSalePrice', { valueAsNumber: true })} className="rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flashSaleStart" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Start Date</Label>
                    <Input id="flashSaleStart" type="datetime-local" {...register('flashSaleStart')} className="rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flashSaleEnd" className="text-xs font-bold text-gray-700 uppercase tracking-wider">End Date</Label>
                    <Input id="flashSaleEnd" type="datetime-local" {...register('flashSaleEnd')} className="rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flashSaleStock" className="text-xs font-bold text-gray-700 uppercase tracking-wider">Flash Sale Stock</Label>
                    <Input id="flashSaleStock" type="number" {...register('flashSaleStock', { valueAsNumber: true })} className="rounded-xl bg-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3 sticky top-6">
              <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] text-white hover:opacity-90 h-11" disabled={submitting}>
                <Save className="w-4 h-4 mr-2" />
                {submitting ? 'Creating...' : 'Create Product'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl h-11 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => router.push('/admin/products')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
