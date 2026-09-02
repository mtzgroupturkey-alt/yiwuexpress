'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Plus, Search, Edit, Trash2, Eye, Package, Star, Sparkles,
  Zap, ArrowUpDown, Filter, RefreshCw, Layers, CheckCircle2,
  AlertTriangle, XCircle, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react'
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'
import { localizeProduct } from '@/lib/utils/localize'

const ADMIN_LOCALE = 'en'

interface Product {
  id: string
  sku: string
  name: string
  slug: string
  price: number
  stock: number
  thumbnail?: string | null
  isActive: boolean
  isFeatured: boolean
  isNewArrival: boolean
  isFlashSale: boolean
  translations?: Array<{ locale: string; name: string }> | null
  category?: {
    name: string
  } | null
}

const SUPPORTED_LOCALES = ['en', 'ru', 'zh'] as const

function TranslationBadges({ product }: { product: Product }) {
  const present = new Set(
    (product.translations || [])
      .filter((t) => t.name && t.name.trim().length > 0)
      .map((t) => t.locale)
  )

  return (
    <div className="mt-1 flex items-center gap-1">
      {SUPPORTED_LOCALES.map((locale) => {
        const has = present.has(locale)
        return (
          <span
            key={locale}
            title={has ? `${locale.toUpperCase()} translation ready` : `${locale.toUpperCase()} missing`}
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              has
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'bg-gray-100 text-gray-400 border border-gray-200/50'
            }`}
          >
            {locale}
          </span>
        )
      })}
    </div>
  )
}

function ProductThumbnail({
  src,
  alt,
  size = 'md'
}: {
  src?: string | null
  alt: string
  size?: 'md' | 'lg'
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(src || null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setImgSrc(src || null)
    setHasError(false)
  }, [src])

  const dim = size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'

  return (
    <div className={`${dim} rounded-xl bg-gray-50 border border-gray-200/80 overflow-hidden shrink-0 relative flex items-center justify-center`}>
      {!hasError && imgSrc ? (
        <img
          src={imgSrc}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={() => {
            setHasError(true)
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
          <Package size={size === 'lg' ? 24 : 18} />
        </div>
      )}
    </div>
  )
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [flatCategories, setFlatCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 20

  useEffect(() => {
    const savedFilters = localStorage.getItem('adminProductsFilters')
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters)
        if (filters.search) setSearch(filters.search)
        if (filters.categoryFilter) setCategoryFilter(filters.categoryFilter)
        if (filters.page) setPage(filters.page)
      } catch (error) {
        console.error('Error loading saved filters:', error)
      }
    }
    setFiltersLoaded(true)
  }, [])

  const flattenCategories = (cats: any[]): any[] => {
    const result: any[] = []
    const flatten = (items: any[]) => {
      items.forEach(cat => {
        result.push(cat)
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children)
        }
      })
    }
    flatten(cats)
    return result
  }

  useEffect(() => {
    if (filtersLoaded) {
      const filters = { search, categoryFilter, page }
      localStorage.setItem('adminProductsFilters', JSON.stringify(filters))
    }
  }, [search, categoryFilter, page, filtersLoaded])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (filtersLoaded) {
      fetchProducts()
    }
  }, [page, search, categoryFilter, filtersLoaded])
  
  useEffect(() => {
    if (flatCategories.length > 0 && categoryFilter) {
      fetchProducts()
    }
  }, [flatCategories.length])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includeChildren=true')
      const data = await response.json()
      if (data.success) {
        const cats = data.data || []
        setCategories(cats)
        setFlatCategories(flattenCategories(cats))
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let categorySlug = null
      if (categoryFilter) {
        if (flatCategories.length === 0) {
          setLoading(false)
          return
        }
        const category = flatCategories.find(c => c.id === categoryFilter)
        categorySlug = category?.slug || null
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(categorySlug && { category: categorySlug })
      })

      const response = await fetch(`/api/admin/products?${params}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.data || [])
        setTotalPages(data.pagination?.pages || 1)
        setTotalCount(data.pagination?.total || data.data?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        fetchProducts()
      } else {
        alert(data.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      const data = await response.json()
      if (data.success) {
        fetchProducts()
      } else {
        alert(data.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
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
        fetchProducts()
      } else {
        alert(data.error || 'Failed to update featured status')
      }
    } catch (error) {
      console.error('Error updating featured status:', error)
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
        fetchProducts()
      } else {
        alert(data.error || 'Failed to update new arrival status')
      }
    } catch (error) {
      console.error('Error updating new arrival status:', error)
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
        fetchProducts()
      } else {
        alert(data.error || 'Failed to update flash sale status')
      }
    } catch (error) {
      console.error('Error updating flash sale status:', error)
    }
  }

  // Summary counts
  const activeCount = products.filter(p => p.isActive).length
  const featuredCount = products.filter(p => p.isFeatured).length
  const lowStockCount = products.filter(p => p.stock < 10).length

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Products Catalog</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#1a3a5c]/10 text-[#1a3a5c] rounded-full">
              {totalCount} total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage product listings, pricing, multilingual readiness, inventory, and promotions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => router.push('/admin/products/new')}
            className="bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] hover:from-[#152e4a] hover:to-[#1d4ed8] text-white shadow-md shadow-blue-900/10 rounded-xl px-4 py-2.5 font-bold text-xs inline-flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </Button>
        </div>
      </div>

      {/* Mini Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Package size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Products</p>
            <p className="text-lg font-black text-gray-900">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Active Listings</p>
            <p className="text-lg font-black text-emerald-600">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Star size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Featured Items</p>
            <p className="text-lg font-black text-amber-600">{featuredCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Low Stock (&lt;10)</p>
            <p className="text-lg font-black text-red-600">{lowStockCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products by title, SKU, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-xs"
          />
        </div>

        <div className="w-full md:w-64">
          <CategoryDropdown
            categories={categories}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="All Categories"
            searchPlaceholder="Search categories..."
            clearable
            showPath
            showLevelIndicator={false}
          />
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setSearch('')
            setCategoryFilter(null)
            setPage(1)
            localStorage.removeItem('adminProductsFilters')
          }}
          className="h-10 px-4 rounded-xl text-xs font-semibold text-gray-600 border-gray-200 hover:bg-gray-50 shrink-0"
        >
          Clear Filters
        </Button>
      </div>

      {/* Products Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin border-t-[#1a3a5c]"></div>
          <p className="text-xs font-medium text-gray-500 mt-3">Loading product inventory...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <Package size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No products found</h3>
          <p className="text-xs text-gray-500 mb-5 max-w-sm mx-auto">
            {search || categoryFilter ? 'No products matched your active filters. Try resetting search criteria.' : 'Your product catalog is empty. Start adding your inventory.'}
          </p>
          <Button onClick={() => router.push('/admin/products/new')} className="bg-[#1a3a5c] text-white text-xs font-bold rounded-xl">
            <Plus size={14} className="mr-1.5" />
            Add First Product
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Product Info</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-3 text-center">Featured</th>
                    <th className="py-3.5 px-3 text-center">New</th>
                    <th className="py-3.5 px-3 text-center">Flash</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {products.map((product) => {
                    const localized = localizeProduct(product, ADMIN_LOCALE)
                    return (
                      <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                        {/* Product Info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3.5">
                            <ProductThumbnail src={product.thumbnail} alt={localized.name} />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate max-w-xs group-hover:text-[#1a3a5c] transition-colors">
                                {localized.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {product.category && (
                                  <span className="text-[11px] text-gray-500 font-medium">
                                    {product.category.name}
                                  </span>
                                )}
                              </div>
                              <TranslationBadges product={product} />
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-4 px-4 font-mono text-[11px] text-gray-600 font-medium">
                          {product.sku || '—'}
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4">
                          <span className="font-bold text-gray-900 text-sm">
                            ${Number(product.price).toFixed(2)}
                          </span>
                        </td>

                        {/* Stock */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            product.stock === 0 
                              ? 'bg-red-50 text-red-600 border border-red-200/50' 
                              : product.stock < 10 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/50' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              product.stock === 0 ? 'bg-red-500' : product.stock < 10 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            {product.stock} in stock
                          </span>
                        </td>

                        {/* Featured Toggle */}
                        <td className="py-4 px-3 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={product.isFeatured}
                              onCheckedChange={() => handleToggleFeatured(product.id, product.isFeatured)}
                              title={product.isFeatured ? 'Remove Featured' : 'Mark Featured'}
                            />
                          </div>
                        </td>

                        {/* New Arrival Toggle */}
                        <td className="py-4 px-3 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={product.isNewArrival}
                              onCheckedChange={() => handleToggleNewArrival(product.id, product.isNewArrival)}
                              title={product.isNewArrival ? 'Remove New Arrival' : 'Mark New Arrival'}
                            />
                          </div>
                        </td>

                        {/* Flash Sale Toggle */}
                        <td className="py-4 px-3 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={product.isFlashSale}
                              onCheckedChange={() => handleToggleFlashSale(product.id, product.isFlashSale)}
                              title={product.isFlashSale ? 'Remove Flash Sale' : 'Mark Flash Sale'}
                            />
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleActive(product.id, product.isActive)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                              product.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`/en/products/${product.slug || product.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View on storefront"
                            >
                              <ExternalLink size={15} />
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                              className="p-1.5 h-auto text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit product"
                            >
                              <Edit size={15} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id, product.name)}
                              className="p-1.5 h-auto text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete product"
                            >
                              <Trash2 size={15} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden space-y-3.5">
            {products.map((product) => {
              const localized = localizeProduct(product, ADMIN_LOCALE)
              return (
                <div key={product.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex gap-3.5">
                    <ProductThumbnail src={product.thumbnail} alt={localized.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{localized.name}</h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">SKU: {product.sku || '—'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-bold text-gray-900 text-sm">${Number(product.price).toFixed(2)}</span>
                        <span className="text-[11px] text-gray-500 font-medium">Stock: {product.stock}</span>
                      </div>
                      <TranslationBadges product={product} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50">
                      <span className="text-gray-500 font-medium">Featured</span>
                      <Switch
                        checked={product.isFeatured}
                        onCheckedChange={() => handleToggleFeatured(product.id, product.isFeatured)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50">
                      <span className="text-gray-500 font-medium">New</span>
                      <Switch
                        checked={product.isNewArrival}
                        onCheckedChange={() => handleToggleNewArrival(product.id, product.isNewArrival)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50">
                      <span className="text-gray-500 font-medium">Active</span>
                      <Switch
                        checked={product.isActive}
                        onCheckedChange={() => handleToggleActive(product.id, product.isActive)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl text-xs font-semibold"
                      onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                    >
                      <Edit size={13} className="mr-1.5" />
                      Edit
                    </Button>
                    <a
                      href={`/en/products/${product.slug || product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id, product.name)}
                      className="px-3 rounded-xl text-red-600 hover:bg-red-50 hover:border-red-200"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
              <p className="text-xs text-gray-500 font-medium">
                Showing page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl text-xs font-semibold"
                >
                  <ChevronLeft size={14} className="mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl text-xs font-semibold"
                >
                  Next
                  <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

