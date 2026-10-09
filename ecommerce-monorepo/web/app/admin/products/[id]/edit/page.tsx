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
import { ArrowLeft, Save, Trash2, ExternalLink, Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { ProductAttributesSection } from '@/components/admin/ProductAttributesSection'
import { ProductTabContentSection, type TabSectionPayload } from '@/components/admin/ProductTabContentSection'
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'
import { ProductMediaUpload } from '@/components/admin/ProductMediaUpload'
import {
  ProductTranslationForm,
  validateTranslations,
  type TranslationPayload
} from '@/components/admin/ProductTranslationForm'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'

interface MediaItem {
  url: string
  type: 'image' | 'video'
}

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  dromkokItemNo: z.string().optional(),
  ikeaItemNo: z.string().optional(),
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  compareAtPrice: z.preprocess((val) => (val === '' || val === null || (typeof val === 'number' && isNaN(val)) ? undefined : typeof val === 'string' ? parseFloat(val) : val), z.number().min(0).optional()),
  costPrice: z.preprocess((val) => (val === '' || val === null || (typeof val === 'number' && isNaN(val)) ? undefined : typeof val === 'string' ? parseFloat(val) : val), z.number().min(0).optional()),
  stock: z.number().int().min(0, 'Stock must be positive'),
  lowStockThreshold: z.number().int().min(0).default(10),
  thumbnail: z.string().optional(),
  weightKg: z.number().min(0, 'Weight is required'),
  hsCode: z.string().optional(),
  countryOfOrigin: z.string().default('China'),
  material: z.string().optional(),
  minOrderQty: z.number().int().min(1).default(1),
  wholesalePrice: z.preprocess((val) => (val === '' || val === null || (typeof val === 'number' && isNaN(val)) ? undefined : typeof val === 'string' ? parseFloat(val) : val), z.number().min(0).optional()),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isActive: z.boolean().default(true),
  availableForRetail: z.boolean().default(true),
  availableForWholesale: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  flashSalePrice: z.preprocess((val) => (val === '' || val === null || (typeof val === 'number' && isNaN(val)) ? undefined : typeof val === 'string' ? parseFloat(val) : val), z.number().min(0).optional()),
  flashSaleStart: z.string().optional(),
  flashSaleEnd: z.string().optional(),
  flashSaleStock: z.preprocess((val) => (val === '' || val === null || (typeof val === 'number' && isNaN(val)) ? undefined : typeof val === 'string' ? parseInt(val) : val), z.number().int().min(0).optional()),
  fragile: z.boolean().default(false),
  exportRestricted: z.boolean().default(false),
  dangerousGoods: z.boolean().default(false),
  batteryIncluded: z.boolean().default(false)
})

type ProductForm = z.input<typeof productSchema>

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { dict } = useAdminLocale()
  const [categories, setCategories] = useState<any[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({})
  const [attributeTranslations, setAttributeTranslations] = useState<Record<string, Record<string, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [deleting, setDeleting] = useState(false)
  const [translations, setTranslations] = useState<TranslationPayload | null>(null)
  const [photoStatus, setPhotoStatus] = useState<{
    isPlaceholder: boolean;
    isReal: boolean;
    reason: string;
    hasCatalogIkeaPhoto: boolean;
    catalogIkeaUrl: string | null;
  } | null>(null)
  const [fetchingIkea, setFetchingIkea] = useState(false)
  const [productRawData, setProductRawData] = useState<any>(null)
  const [tabContentPayload, setTabContentPayload] = useState<TabSectionPayload | null>(null)

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

  const fetchPhotoStatus = async () => {
    try {
      const res = await fetch(`/api/admin/products/${params.id}/photo-status`)
      if (res.ok) {
        const data = await res.json()
        setPhotoStatus(data)
      }
    } catch {
      // ignore
    }
  }

  const handleAutoFetchIkea = async () => {
    setFetchingIkea(true)
    try {
      const res = await fetch(`/api/admin/products/${params.id}/fetch-ikea-photo`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch IKEA photo')
      }

      if (data.newThumbnail) {
        // Completely replace media list with the newly downloaded real IKEA photo (discarding the old placeholder)
        setMedia([{ url: data.newThumbnail, type: 'image' }])
        setValue('thumbnail', data.newThumbnail)
      }

      await fetchPhotoStatus()
      alert('✅ Official IKEA.com photo successfully downloaded, converted to WebP, and applied! Old placeholder removed.')
    } catch (err: any) {
      alert(`❌ ${err.message || 'Error fetching IKEA photo'}`)
    } finally {
      setFetchingIkea(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchProduct()
    fetchPhotoStatus()
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
        setProductRawData(product)
        
        // Reset form with product data
        reset({
          sku: product.sku,
          dromkokItemNo: product.dromkokItemNo || '',
          ikeaItemNo: product.ikeaItemNo || '',
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          categoryId: product.categoryId || '',
          price: product.price,
          compareAtPrice: product.compareAtPrice !== null && product.compareAtPrice !== undefined ? product.compareAtPrice : undefined,
          costPrice: product.costPrice !== null && product.costPrice !== undefined ? product.costPrice : undefined,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          weightKg: product.weightKg,
          hsCode: product.hsCode || '',
          countryOfOrigin: product.countryOfOrigin,
          material: product.material || '',
          minOrderQty: product.minOrderQty,
          wholesalePrice: product.wholesalePrice !== null && product.wholesalePrice !== undefined ? product.wholesalePrice : undefined,
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || '',
          isActive: product.isActive,
          availableForRetail: product.availableForRetail ?? true,
          availableForWholesale: product.availableForWholesale ?? true,
          isFeatured: product.isFeatured,
          isFlashSale: product.isFlashSale,
          flashSalePrice: product.flashSalePrice !== null && product.flashSalePrice !== undefined ? product.flashSalePrice : undefined,
          flashSaleStart: product.flashSaleStart ? new Date(product.flashSaleStart).toISOString().slice(0, 16) : undefined,
          flashSaleEnd: product.flashSaleEnd ? new Date(product.flashSaleEnd).toISOString().slice(0, 16) : undefined,
          flashSaleStock: product.flashSaleStock !== null && product.flashSaleStock !== undefined ? product.flashSaleStock : undefined,
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

        // Seed translation state (Expand-and-Contract Phase 3): prefer existing
        // translation rows, fall back to legacy name/description/meta for 'en'.
        const initialTranslations: TranslationPayload = {
          en: {
            name: product.name || '',
            description: product.description || '',
            metaTitle: product.metaTitle || '',
            metaDescription: product.metaDescription || '',
          },
          ru: { name: '', description: '', metaTitle: '', metaDescription: '' },
          zh: { name: '', description: '', metaTitle: '', metaDescription: '' }
        }

        if (product.translations && Array.isArray(product.translations)) {
          product.translations.forEach((t: any) => {
            const currentLocale = t.locale as 'en' | 'ru' | 'zh'

            if (['en', 'ru', 'zh'].includes(currentLocale)) {
              initialTranslations[currentLocale] = {
                name: t.name || '',
                description: t.description || '',
                metaTitle: t.metaTitle || '',
                metaDescription: t.metaDescription || ''
              }
            }
          })
        }

        setTranslations(initialTranslations)

        // Set attribute values if they exist
        if (product.attributes) {
          setAttributeValues(product.attributes)
        }
        if (product.attributeTranslations) {
          setAttributeTranslations(product.attributeTranslations)
        }
      } else {
        alert(dict.products.productNotFound)
        router.push('/admin/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      alert(dict.products.loadProductFailed)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProductForm) => {
    setSubmitting(true)
    try {
      // Validate translations: English name is mandatory.
      if (!translations || !validateTranslations(translations).valid) {
        alert(validateTranslations(translations ?? ({} as TranslationPayload)).error ||
          dict.products.nameRequiredError)
        setSubmitting(false)
        return
      }

      // Separate images and videos
      const images = media.filter(m => m.type === 'image').map(m => m.url)
      const videos = media.filter(m => m.type === 'video').map(m => m.url)

      const productData: any = {
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
        compareAtPrice: data.compareAtPrice !== undefined && data.compareAtPrice !== null && !isNaN(Number(data.compareAtPrice)) ? parseFloat(data.compareAtPrice.toString()) : null,
        costPrice: data.costPrice !== undefined && data.costPrice !== null && !isNaN(Number(data.costPrice)) ? parseFloat(data.costPrice.toString()) : null,
        wholesalePrice: data.wholesalePrice !== undefined && data.wholesalePrice !== null && !isNaN(Number(data.wholesalePrice)) ? parseFloat(data.wholesalePrice.toString()) : null,
        weightKg: parseFloat(data.weightKg.toString()),
        stock: parseInt(data.stock.toString()),
        lowStockThreshold: parseInt((data.lowStockThreshold ?? 10).toString()),
        minOrderQty: parseInt((data.minOrderQty ?? 1).toString()),
        isFlashSale: data.isFlashSale,
        flashSalePrice: data.flashSalePrice !== undefined && data.flashSalePrice !== null && !isNaN(Number(data.flashSalePrice)) ? parseFloat(data.flashSalePrice.toString()) : null,
        flashSaleStart: data.flashSaleStart ? new Date(data.flashSaleStart).toISOString() : null,
        flashSaleEnd: data.flashSaleEnd ? new Date(data.flashSaleEnd).toISOString() : null,
        flashSaleStock: data.flashSaleStock !== undefined && data.flashSaleStock !== null && !isNaN(Number(data.flashSaleStock)) ? parseInt(data.flashSaleStock.toString()) : null,
        attributes: attributeValues, // Include attribute values
        attributeTranslations,
      }

      if (tabContentPayload) {
        if (tabContentPayload.rawIkeaPayload) {
          productData.rawIkeaPayload = tabContentPayload.rawIkeaPayload
        }
        if (tabContentPayload.dimensions) {
          productData.dimensions = tabContentPayload.dimensions
        }
        if (tabContentPayload.material) {
          productData.material = tabContentPayload.material
        }
      }

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      const result = await response.json()

      if (result.success) {
        alert(dict.products.productUpdatedSuccess)
        router.push('/admin/products')
      } else {
        alert(result.error || dict.products.updateFailed)
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert(dict.products.updateFailed)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(dict.products.deleteConfirm)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        alert(dict.products.productDeletedSuccess)
        router.push('/admin/products')
      } else {
        alert(result.error || dict.products.deleteFailed)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert(dict.products.deleteFailed)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">{dict.products.loadingProduct}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Modern Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <button onClick={() => router.push('/admin/products')} className="hover:text-[#1a3a5c] transition-colors">{dict.nav.products}</button>
            <span>/</span>
            <span className="text-gray-900 font-medium">{dict.products.editBreadcrumb}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a3a5c]">{dict.products.editProduct}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? dict.common.loading : dict.common.delete}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl hidden sm:flex"
            onClick={() => router.push('/admin/products')}
          >
            {dict.common.cancel}
          </Button>
          {watch('slug') && (
            <a
              href={`/products/${watch('slug')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm"
              title="Preview product on storefront in new tab"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View in Store
            </a>
          )}
          <Button 
            onClick={handleSubmit(onSubmit)} 
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] text-white hover:opacity-90 transition-opacity"
          >
            <Save className="w-4 h-4 mr-2" />
            {submitting ? dict.products.savingProduct : dict.common.save}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">{dict.products.basicInfo}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.sku} *</Label>
                  <Input id="sku" {...register('sku')} className="rounded-xl bg-gray-50/50 focus:bg-white transition-colors" />
                  {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.category}</Label>
                  <CategoryDropdown
                    categories={categories}
                    value={selectedCategoryId}
                    onChange={(value) => setValue('categoryId', value || '')}
                    placeholder={dict.products.selectCategory}
                    searchPlaceholder={dict.products.searchCategories}
                    clearable
                    showPath
                    showLevelIndicator
                  />
                </div>
              </div>

              {/* Dromkok & IKEA Item Identifiers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/60">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dromkokItemNo" className="text-xs font-bold text-[#1a3a5c] uppercase tracking-wider">
                      Dromkok Item # (Public)
                    </Label>
                    <span className="text-[10px] text-slate-500 font-mono">e.g. DK-100.010.87</span>
                  </div>
                  <Input
                    id="dromkokItemNo"
                    {...register('dromkokItemNo')}
                    placeholder="DK-XXX.XXX.XX"
                    className="rounded-xl bg-white font-mono text-sm border-slate-200 focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">Public customer item number visible on product pages and invoices.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ikeaItemNo" className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      IKEA Item # (Admin Only)
                    </Label>
                    {watch('ikeaItemNo') && (
                      <a
                        href={`https://www.ikea.com/us/en/p/-${watch('ikeaItemNo')?.replace(/\D/g, '')}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        title="Open on IKEA.com"
                      >
                        <ExternalLink size={12} />
                        View on IKEA
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="ikeaItemNo"
                      {...register('ikeaItemNo')}
                      placeholder="XXX.XXX.XX (e.g. 104.114.96)"
                      className="rounded-xl bg-white font-mono text-sm border-amber-200/80 focus:border-amber-500 flex-1"
                    />
                    {watch('ikeaItemNo') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const digits = watch('ikeaItemNo')?.replace(/\D/g, '');
                          if (digits) {
                            window.open(`https://www.ikea.com/us/en/p/-${digits}/`, '_blank');
                          }
                        }}
                        className="rounded-xl border-amber-300 text-amber-800 bg-amber-50/70 hover:bg-amber-100 text-xs shrink-0"
                      >
                        <ExternalLink size={13} className="mr-1" />
                        IKEA
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-700/80 font-medium">Internal supplier reference. Hidden from customers and public APIs.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="sr-only">{dict.products.productName} *</Label>
                {translations && (
                  <ProductTranslationForm
                    initialValues={translations}
                    onChange={(newTrans) => {
                      setTranslations(newTrans)
                      if (newTrans.en.metaTitle) setValue('metaTitle', newTrans.en.metaTitle)
                      if (newTrans.en.metaDescription) setValue('metaDescription', newTrans.en.metaDescription)
                    }}
                    extraFieldsToTranslate={Object.entries(attributeValues).reduce((acc, [k, v]) => {
                      if (typeof v === 'string' && v.trim().length > 0) {
                        acc[k] = v.trim()
                      } else if (Array.isArray(v) && v.length > 0) {
                        acc[k] = v.map(item => typeof item === 'string' ? item : String(item)).join(', ')
                      }
                      return acc
                    }, {} as Record<string, string>)}
                    onAttributesTranslated={(newAttrs) => {
                      setAttributeTranslations((prev) => ({ ...prev, ...newAttrs }))
                    }}
                    disabled={submitting}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.slug} *</Label>
                <Input id="slug" {...register('slug')} className="rounded-xl bg-gray-50/50 focus:bg-white transition-colors" />
                {errors.slug && <p className="text-red-600 text-sm mt-1">{errors.slug.message}</p>}
              </div>
            </div>

            {/* Dynamic Attributes */}
            <ProductAttributesSection
              categoryId={selectedCategoryId}
              initialValues={attributeValues}
              attributeTranslations={attributeTranslations}
              onChange={(values, translations) => {
                setAttributeValues(values)
                setAttributeTranslations(translations)
              }}
            />

            {/* Storefront Tab Content & Descriptions (Overview, Key Features & Details, Measurements) */}
            {productRawData && (
              <ProductTabContentSection
                initialRawIkeaPayload={productRawData.rawIkeaPayload}
                initialDimensions={productRawData.dimensions}
                initialMaterial={productRawData.material}
                initialDescription={productRawData.description}
                disabled={submitting}
                onChange={(payload) => setTabContentPayload(payload)}
              />
            )}

            {/* Pricing */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">{dict.products.pricing}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.priceWithSymbol} *</Label>
                  <Input id="price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} className="rounded-xl" />
                  {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.compareAtPriceWithSymbol}</Label>
                  <Input id="compareAtPrice" type="number" step="0.01" {...register('compareAtPrice', { valueAsNumber: true })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.costPriceWithSymbol}</Label>
                  <Input id="costPrice" type="number" step="0.01" {...register('costPrice', { valueAsNumber: true })} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="wholesalePrice" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.wholesalePriceWithSymbol}</Label>
                  <Input id="wholesalePrice" type="number" step="0.01" {...register('wholesalePrice', { valueAsNumber: true })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOrderQty" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.minOrderQuantityLabel}</Label>
                  <Input id="minOrderQty" type="number" {...register('minOrderQty', { valueAsNumber: true })} className="rounded-xl" />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">{dict.products.inventory}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="stock" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.stockQuantity} *</Label>
                    <span className="text-[11px] text-amber-600 font-medium">Stock &gt; 15 qualifies for ⚡ EXPRESS badge</span>
                  </div>
                  <Input id="stock" type="number" {...register('stock', { valueAsNumber: true })} className="rounded-xl" />
                  <p className="text-[11px] text-gray-400">Products with stock greater than 15 automatically display the ⚡ EXPRESS delivery badge on cards.</p>
                  {errors.stock && <p className="text-red-600 text-sm mt-1">{errors.stock.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.lowStockThreshold}</Label>
                  <Input id="lowStockThreshold" type="number" {...register('lowStockThreshold', { valueAsNumber: true })} className="rounded-xl" />
                </div>
              </div>
            </div>

            {/* Compliance & Shipping */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">{dict.products.complianceShipping}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="weightKg" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.weightKg} *</Label>
                  <Input id="weightKg" type="number" step="0.01" {...register('weightKg', { valueAsNumber: true })} className="rounded-xl" />
                  {errors.weightKg && <p className="text-red-600 text-sm mt-1">{errors.weightKg.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsCode" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.hsCode}</Label>
                  <Input id="hsCode" {...register('hsCode')} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="countryOfOrigin" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.countryOfOrigin}</Label>
                  <Input id="countryOfOrigin" {...register('countryOfOrigin')} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.material}</Label>
                  <Input id="material" {...register('material')} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register('fragile')} className="w-4 h-4 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                  <span className="text-sm font-medium group-hover:text-gray-900">{dict.products.fragile}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register('exportRestricted')} className="w-4 h-4 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                  <span className="text-sm font-medium group-hover:text-gray-900">{dict.products.exportRestricted}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register('dangerousGoods')} className="w-4 h-4 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                  <span className="text-sm font-medium group-hover:text-gray-900">{dict.products.dangerousGoods}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register('batteryIncluded')} className="w-4 h-4 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                  <span className="text-sm font-medium group-hover:text-gray-900">{dict.products.batteryIncluded}</span>
                </label>
              </div>
            </div>

            {/* Images & Videos */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <h2 className="text-lg font-bold text-[#1a3a5c]">{dict.products.imagesVideos}</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoFetchIkea}
                  disabled={fetchingIkea}
                  className="rounded-xl border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 gap-1.5 text-xs font-semibold shadow-2xs"
                  title="Automatically look up and download the official photo from IKEA.com for this product"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${fetchingIkea ? 'animate-spin' : 'text-blue-600'}`} />
                  {fetchingIkea ? 'Fetching from IKEA...' : 'Auto-Fetch from IKEA.com'}
                </Button>
              </div>

              {/* Photo Quality / Placeholder Diagnostic Banner */}
              {photoStatus && (photoStatus.isPlaceholder || !photoStatus.isReal) && (
                <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-bold text-amber-900 text-sm">
                        Placeholder / Non-Authentic Image Detected
                      </div>
                      <div className="text-xs text-amber-700 mt-0.5">
                        {photoStatus.reason || 'This product is currently displaying a placeholder image.'}
                        {photoStatus.hasCatalogIkeaPhoto && ' Official IKEA.com catalog photo is available!'}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAutoFetchIkea}
                    disabled={fetchingIkea}
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs shrink-0 gap-1.5"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${fetchingIkea ? 'animate-spin' : ''}`} />
                    {fetchingIkea ? 'Downloading...' : 'Replace with Real IKEA Photo'}
                  </Button>
                </div>
              )}

              {photoStatus && photoStatus.isReal && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">Verified Real Product Photo</span>
                    <span className="text-emerald-600">({photoStatus.reason})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFetchIkea}
                    disabled={fetchingIkea}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Re-sync from IKEA.com
                  </button>
                </div>
              )}

              <ProductMediaUpload
                media={media}
                onChange={setMedia}
                maxItems={15}
              />
            </div>

            {/* SEO */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">{dict.products.seo}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.metaTitle}</Label>
                  <Input id="metaTitle" {...register('metaTitle')} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.metaDescription}</Label>
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
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">{dict.products.statusSection}</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" {...register('isActive')} className="w-5 h-5 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                  <span className="text-sm font-medium group-hover:text-gray-900">{dict.products.activeVisible}</span>
                </label>
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Sales Channels</span>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" {...register('availableForRetail')} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                    <div>
                      <span className="text-sm font-medium group-hover:text-gray-900 block">Available for Retail (B2C)</span>
                      <span className="text-[11px] text-gray-400">Listed for consumer checkout</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" {...register('availableForWholesale')} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
                    <div>
                      <span className="text-sm font-medium group-hover:text-gray-900 block">Available for Wholesale (B2B)</span>
                      <span className="text-[11px] text-gray-400">Listed with MOQ and tiered pricing</span>
                    </div>
                  </label>
                </div>
                <label className="flex items-start gap-3 cursor-pointer group pt-2 border-t border-gray-100">
                  <input type="checkbox" {...register('isFeatured')} className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium group-hover:text-gray-900 block">{dict.products.featured} (BESTSELLER Badge)</span>
                    <span className="text-[11px] text-gray-400">Enabling this awards the product the BESTSELLER badge on product cards and features it prominently across the store.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Flash Sale */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-[#1a3a5c] border-b pb-3">{dict.products.flashSale}</h2>
              <label className="flex items-center gap-3 cursor-pointer group mb-4">
                <input type="checkbox" {...register('isFlashSale')} className="w-5 h-5 rounded text-[#1a3a5c] focus:ring-[#1a3a5c]" />
                <span className="text-sm font-medium group-hover:text-gray-900">{dict.products.enableFlashSale}</span>
              </label>
              
              {watch('isFlashSale') && (
                <div className="space-y-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="space-y-2">
                    <Label htmlFor="flashSalePrice" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.flashSalePriceWithSymbol}</Label>
                    <Input id="flashSalePrice" type="number" step="0.01" {...register('flashSalePrice', { valueAsNumber: true })} className="rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flashSaleStart" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.startDate}</Label>
                    <Input id="flashSaleStart" type="datetime-local" {...register('flashSaleStart')} className="rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flashSaleEnd" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.endDate}</Label>
                    <Input id="flashSaleEnd" type="datetime-local" {...register('flashSaleEnd')} className="rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flashSaleStock" className="text-xs font-bold text-gray-700 uppercase tracking-wider">{dict.products.flashSaleStock}</Label>
                    <Input id="flashSaleStock" type="number" {...register('flashSaleStock', { valueAsNumber: true })} className="rounded-xl bg-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3 sticky top-6">
              <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] text-white hover:opacity-90 h-11" disabled={submitting}>
                <Save className="w-4 h-4 mr-2" />
                {submitting ? dict.products.savingProduct : dict.common.save}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl h-11 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => router.push('/admin/products')}
              >
                {dict.common.cancel}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
