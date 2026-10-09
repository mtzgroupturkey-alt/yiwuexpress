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
  AlertTriangle, XCircle, ExternalLink, ChevronLeft, ChevronRight,
  CheckSquare, Square, X, Image as ImageIcon, SlidersHorizontal,
  ArrowUp, ArrowDown, Tag
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'
import { localizeProduct } from '@/lib/utils/localize'
import { useAdminLocale } from '../contexts/AdminLocaleContext'

interface Product {
  id: string
  sku: string
  dromkokItemNo?: string | null
  ikeaItemNo?: string | null
  rawIkeaPayload?: any
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

function getProductSwedenName(product: Product): string {
  const raw = product.rawIkeaPayload as any
  if (raw?.swedenName && typeof raw.swedenName === 'string' && raw.swedenName.trim()) {
    return raw.swedenName.trim()
  }
  if (raw?.swedishName && typeof raw.swedishName === 'string' && raw.swedishName.trim()) {
    return raw.swedishName.trim()
  }
  if (raw?.productDetails?.swedenName && typeof raw.productDetails.swedenName === 'string' && raw.productDetails.swedenName.trim()) {
    return raw.productDetails.swedenName.trim()
  }
  if (raw?.productDetails?.swedishSeries && typeof raw.productDetails.swedishSeries === 'string' && raw.productDetails.swedishSeries.trim()) {
    return raw.productDetails.swedishSeries.trim()
  }
  if (raw?.item?.itemMeasureReferenceText && typeof raw.item.itemMeasureReferenceText === 'string' && raw.item.itemMeasureReferenceText.trim()) {
    return raw.item.itemMeasureReferenceText.trim()
  }
  if (raw?.translations && typeof raw.translations === 'object') {
    for (const loc of ['en', 'sv', 'ru', 'zh']) {
      const trans = raw.translations[loc]
      if (trans?.swedenName && typeof trans.swedenName === 'string' && trans.swedenName.trim()) {
        return trans.swedenName.trim()
      }
      if (trans?.productDetails?.swedenName && typeof trans.productDetails.swedenName === 'string' && trans.productDetails.swedenName.trim()) {
        return trans.productDetails.swedenName.trim()
      }
    }
  }
  const rawName = (product.name || '').trim()
  const match = rawName.match(/^([A-ZÅÄÖØÆÉÈÜ0-9]{2,})/u)
  if (match) {
    return match[1]
  }
  return ''
}

// English name and Swedish name are separate — show the English name in full.
// The Swedish series badge is displayed separately above it.
function getProductDisplayTitle(name: string): string {
  return name || ''
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
  productId,
  size = 'md'
}: {
  src?: string | null
  alt: string
  productId?: string
  size?: 'md' | 'lg'
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(src || null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setImgSrc(src || null)
    setHasError(false)
  }, [src])

  const dim = size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'
  const isMissing = !imgSrc || hasError

  const thumbnailBox = (
    <div className={`${dim} rounded-xl bg-gray-50 border border-gray-200/80 overflow-hidden shrink-0 relative flex items-center justify-center group/thumb`}>
      {!hasError && imgSrc ? (
        <img
          src={imgSrc}
          alt={alt}
          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
          onError={() => {
            setHasError(true)
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 relative">
          <img
            src="/images/product-placeholder.webp"
            alt={alt}
            className="w-full h-full object-contain p-1 opacity-70"
          />
          <span className="absolute inset-x-0 bottom-0 bg-amber-500/90 text-white text-[8px] font-bold text-center py-0.5 leading-none">
            No image
          </span>
        </div>
      )}
    </div>
  )

  if (isMissing && productId) {
    return (
      <Link
        href={`/admin/products/${productId}/edit`}
        title="No image uploaded — click to edit and upload"
        className="cursor-pointer hover:opacity-90 transition-opacity focus:outline-hidden"
      >
        {thumbnailBox}
      </Link>
    )
  }

  return thumbnailBox
}

export default function AdminProductsPage() {
  const router = useRouter()
  const { locale, dict, t } = useAdminLocale()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [flatCategories, setFlatCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'featured' | 'new_arrival' | 'flash_sale'>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')
  const [imageFilter, setImageFilter] = useState<'all' | 'real' | 'placeholder'>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    featured: 0,
    newArrival: 0,
    flashSale: 0,
    lowStock: 0,
    outOfStock: 0
  })
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const toggleSelectAll = () => {
    const currentIds = products.map(p => p.id)
    const allSelected = currentIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleBulkAction = async (action: 'TOGGLE_STATUS' | 'DELETE', isActive?: boolean) => {
    if (selectedIds.length === 0) return

    if (action === 'DELETE') {
      const confirmMsg = (dict.bulk?.confirmBulkDelete || 'Are you sure you want to delete {count} selected item(s)?').replace('{count}', selectedIds.length.toString())
      if (!window.confirm(confirmMsg)) return
    }

    setBulkProcessing(true)
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ids: selectedIds,
          action,
          isActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedIds([])
        fetchProducts()
      } else {
        alert(data.error || 'Failed to process bulk action')
      }
    } catch (err) {
      console.error('Bulk action error:', err)
      alert('Network error')
    } finally {
      setBulkProcessing(false)
    }
  }

  useEffect(() => {
    const savedFilters = localStorage.getItem('adminProductsFilters')
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters)
        if (filters.search) {
          setSearch(filters.search)
          setDebouncedSearch(filters.search)
        }
        if (filters.categoryFilter) setCategoryFilter(filters.categoryFilter)
        if (filters.statusFilter) setStatusFilter(filters.statusFilter)
        if (filters.badgeFilter) setBadgeFilter(filters.badgeFilter)
        if (filters.stockFilter) setStockFilter(filters.stockFilter)
        if (filters.imageFilter) setImageFilter(filters.imageFilter)
        if (filters.sortBy) setSortBy(filters.sortBy)
        if (filters.sortOrder) setSortOrder(filters.sortOrder)
        if (filters.limit) setLimit(filters.limit)
        // If restoring a search, ensure page starts at 1
        if (filters.page && !filters.search) setPage(filters.page)
      } catch (error) {
        console.error('Error loading saved filters:', error)
      }
    }
    setFiltersLoaded(true)
  }, [])

  // Handle live search input: updates query and immediately resets page to 1
  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  // Handle category filter change: immediately resets page to 1
  const handleCategoryChange = (val: string | null) => {
    setCategoryFilter(val)
    setPage(1)
  }

  // Debounce search query by 250ms for smooth live search across all products
  useEffect(() => {
    if (search !== debouncedSearch) {
      setIsSearching(true)
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setIsSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

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
      const filters = {
        search: debouncedSearch,
        categoryFilter,
        statusFilter,
        badgeFilter,
        stockFilter,
        imageFilter,
        sortBy,
        sortOrder,
        page,
        limit
      }
      localStorage.setItem('adminProductsFilters', JSON.stringify(filters))
    }
  }, [
    debouncedSearch,
    categoryFilter,
    statusFilter,
    badgeFilter,
    stockFilter,
    imageFilter,
    sortBy,
    sortOrder,
    page,
    limit,
    filtersLoaded
  ])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (filtersLoaded) {
      fetchProducts()
    }
  }, [
    page,
    limit,
    debouncedSearch,
    categoryFilter,
    statusFilter,
    badgeFilter,
    stockFilter,
    imageFilter,
    sortBy,
    sortOrder,
    filtersLoaded
  ])
  
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

      const trimmedSearch = debouncedSearch.trim()
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(trimmedSearch && { search: trimmedSearch }),
        ...(categorySlug && { category: categorySlug }),
        ...(statusFilter !== 'all' && { isActive: (statusFilter === 'active').toString() }),
        ...(badgeFilter === 'featured' && { isFeatured: 'true' }),
        ...(badgeFilter === 'new_arrival' && { isNewArrival: 'true' }),
        ...(badgeFilter === 'flash_sale' && { isFlashSale: 'true' }),
        ...(stockFilter !== 'all' && { stockStatus: stockFilter }),
        ...(imageFilter === 'real' && { hasRealImage: 'true' }),
        ...(imageFilter === 'placeholder' && { hasRealImage: 'false' }),
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/admin/products?${params}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.data || [])
        setTotalPages(data.pagination?.pages || 1)
        setTotalCount(data.pagination?.total || data.data?.length || 0)
        if (data.metrics) {
          setMetrics(data.metrics)
        } else {
          setMetrics({
            total: data.pagination?.total || data.data?.length || 0,
            active: (data.data || []).filter((p: any) => p.isActive).length,
            featured: (data.data || []).filter((p: any) => p.isFeatured).length,
            newArrival: (data.data || []).filter((p: any) => p.isNewArrival).length,
            flashSale: (data.data || []).filter((p: any) => p.isFlashSale).length,
            lowStock: (data.data || []).filter((p: any) => p.stock > 0 && p.stock < 10).length,
            outOfStock: (data.data || []).filter((p: any) => p.stock <= 0).length,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        setProductToDelete(null)
        fetchProducts()
      } else {
        alert(data.error || dict.common.errorOccurred)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert(dict.common.errorOccurred)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    // Optimistic local update (AJAX, no page reset or loading spinner)
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, isActive: nextStatus } : p))
    )
    setMetrics(prev => ({
      ...prev,
      active: Math.max(0, prev.active + (nextStatus ? 1 : -1))
    }))

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus })
      })

      const data = await response.json()
      if (!data.success) {
        // Rollback on failure
        setProducts(prev =>
          prev.map(p => (p.id === id ? { ...p, isActive: currentStatus } : p))
        )
        setMetrics(prev => ({
          ...prev,
          active: Math.max(0, prev.active + (currentStatus ? 1 : -1))
        }))
        alert(data.error || 'Failed to update product status')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      // Rollback on error
      setProducts(prev =>
        prev.map(p => (p.id === id ? { ...p, isActive: currentStatus } : p))
      )
      setMetrics(prev => ({
        ...prev,
        active: Math.max(0, prev.active + (currentStatus ? 1 : -1))
      }))
      alert('Failed to update product status due to network error')
    }
  }

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    // Optimistic local update (AJAX, no page reset or loading spinner)
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, isFeatured: nextStatus } : p))
    )
    setMetrics(prev => ({
      ...prev,
      featured: Math.max(0, prev.featured + (nextStatus ? 1 : -1))
    }))

    try {
      const response = await fetch(`/api/admin/products/${id}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: nextStatus })
      })

      const data = await response.json()
      if (!data.success) {
        // Rollback on failure
        setProducts(prev =>
          prev.map(p => (p.id === id ? { ...p, isFeatured: currentStatus } : p))
        )
        setMetrics(prev => ({
          ...prev,
          featured: Math.max(0, prev.featured + (currentStatus ? 1 : -1))
        }))
        alert(data.error || 'Failed to update featured status')
      }
    } catch (error) {
      console.error('Error updating featured status:', error)
      // Rollback on error
      setProducts(prev =>
        prev.map(p => (p.id === id ? { ...p, isFeatured: currentStatus } : p))
      )
      setMetrics(prev => ({
        ...prev,
        featured: Math.max(0, prev.featured + (currentStatus ? 1 : -1))
      }))
      alert('Failed to update featured status due to network error')
    }
  }

  const handleToggleNewArrival = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    // Optimistic local update (AJAX, no page reset or loading spinner)
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, isNewArrival: nextStatus } : p))
    )

    try {
      const response = await fetch(`/api/admin/products/${id}/new-arrival`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isNewArrival: nextStatus })
      })

      const data = await response.json()
      if (!data.success) {
        // Rollback on failure
        setProducts(prev =>
          prev.map(p => (p.id === id ? { ...p, isNewArrival: currentStatus } : p))
        )
        alert(data.error || 'Failed to update new arrival status')
      }
    } catch (error) {
      console.error('Error updating new arrival status:', error)
      // Rollback on error
      setProducts(prev =>
        prev.map(p => (p.id === id ? { ...p, isNewArrival: currentStatus } : p))
      )
      alert('Failed to update new arrival status due to network error')
    }
  }

  const handleToggleFlashSale = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    // Optimistic local update (AJAX, no page reset or loading spinner)
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, isFlashSale: nextStatus } : p))
    )

    try {
      const response = await fetch(`/api/admin/products/${id}/flash-sale`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlashSale: nextStatus })
      })

      const data = await response.json()
      if (!data.success) {
        // Rollback on failure
        setProducts(prev =>
          prev.map(p => (p.id === id ? { ...p, isFlashSale: currentStatus } : p))
        )
        alert(data.error || 'Failed to update flash sale status')
      }
    } catch (error) {
      console.error('Error updating flash sale status:', error)
      // Rollback on error
      setProducts(prev =>
        prev.map(p => (p.id === id ? { ...p, isFlashSale: currentStatus } : p))
      )
      alert('Failed to update flash sale status due to network error')
    }
  }

  // Summary counts (from database metrics across all matching products)
  const activeCount = metrics.active
  const featuredCount = metrics.featured
  const newArrivalCount = metrics.newArrival
  const flashSaleCount = metrics.flashSale
  const lowStockCount = metrics.lowStock
  const outOfStockCount = metrics.outOfStock

  const resetAllFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setCategoryFilter(null)
    setStatusFilter('all')
    setBadgeFilter('all')
    setStockFilter('all')
    setImageFilter('all')
    setSortBy('createdAt')
    setSortOrder('desc')
    setPage(1)
    localStorage.removeItem('adminProductsFilters')
  }

  const hasActiveFilters = Boolean(
    debouncedSearch.trim() ||
    categoryFilter ||
    statusFilter !== 'all' ||
    badgeFilter !== 'all' ||
    stockFilter !== 'all' ||
    imageFilter !== 'all' ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc'
  )

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{dict.products.title}</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#1a3a5c]/10 text-[#1a3a5c] rounded-full">
              {totalCount} {dict.common.total.toLowerCase()}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {dict.products.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => router.push('/admin/products/new')}
            className="bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] hover:from-[#152e4a] hover:to-[#1d4ed8] text-white shadow-md shadow-blue-900/10 rounded-xl px-4 py-2.5 font-bold text-xs inline-flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>{dict.products.addProduct}</span>
          </Button>
        </div>
      </div>

      {/* Interactive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Products */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('all')
            setBadgeFilter('all')
            setStockFilter('all')
            setImageFilter('all')
            setPage(1)
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'all' && badgeFilter === 'all' && stockFilter === 'all' && imageFilter === 'all'
              ? 'bg-blue-50/40 border-blue-200 ring-2 ring-blue-500/20'
              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Package size={14} />
            </div>
            <span className="text-[11px] text-gray-500 font-medium truncate">{dict.dashboard.totalProducts}</span>
          </div>
          <p className="text-lg font-black text-gray-900">{metrics.total}</p>
        </button>

        {/* Active */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter(prev => prev === 'active' ? 'all' : 'active')
            setPage(1)
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'active'
              ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/30'
              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={14} />
            </div>
            <span className="text-[11px] text-gray-500 font-medium truncate">{dict.common.active}</span>
          </div>
          <p className="text-lg font-black text-emerald-600">{activeCount}</p>
        </button>

        {/* Featured */}
        <button
          type="button"
          onClick={() => {
            setBadgeFilter(prev => prev === 'featured' ? 'all' : 'featured')
            setPage(1)
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            badgeFilter === 'featured'
              ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/30'
              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Star size={14} />
            </div>
            <span className="text-[11px] text-gray-500 font-medium truncate">{dict.products.featured}</span>
          </div>
          <p className="text-lg font-black text-amber-600">{featuredCount}</p>
        </button>

        {/* New Arrivals */}
        <button
          type="button"
          onClick={() => {
            setBadgeFilter(prev => prev === 'new_arrival' ? 'all' : 'new_arrival')
            setPage(1)
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            badgeFilter === 'new_arrival'
              ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/30'
              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles size={14} />
            </div>
            <span className="text-[11px] text-gray-500 font-medium truncate">{dict.products.newArrival}</span>
          </div>
          <p className="text-lg font-black text-indigo-600">{newArrivalCount}</p>
        </button>

        {/* Flash Sale */}
        <button
          type="button"
          onClick={() => {
            setBadgeFilter(prev => prev === 'flash_sale' ? 'all' : 'flash_sale')
            setPage(1)
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            badgeFilter === 'flash_sale'
              ? 'bg-purple-50/50 border-purple-300 ring-2 ring-purple-500/30'
              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Zap size={14} />
            </div>
            <span className="text-[11px] text-gray-500 font-medium truncate">{dict.products.flashSale}</span>
          </div>
          <p className="text-lg font-black text-purple-600">{flashSaleCount}</p>
        </button>

        {/* Low Stock */}
        <button
          type="button"
          onClick={() => {
            setStockFilter(prev => prev === 'low_stock' ? 'all' : 'low_stock')
            setPage(1)
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            stockFilter === 'low_stock'
              ? 'bg-red-50/50 border-red-300 ring-2 ring-red-500/30'
              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle size={14} />
            </div>
            <span className="text-[11px] text-gray-500 font-medium truncate">{dict.dashboard.lowStock}</span>
          </div>
          <p className="text-lg font-black text-red-600">{lowStockCount}</p>
        </button>
      </div>

      {/* Quick Filter Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Filter size={12} />
          Quick:
        </span>

        <button
          type="button"
          onClick={() => {
            setBadgeFilter('all')
            setStatusFilter('all')
            setStockFilter('all')
            setImageFilter('all')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            badgeFilter === 'all' && statusFilter === 'all' && stockFilter === 'all' && imageFilter === 'all'
              ? 'bg-[#1a3a5c] text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
          }`}
        >
          All ({totalCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setBadgeFilter(prev => prev === 'featured' ? 'all' : 'featured')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
            badgeFilter === 'featured'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-amber-50/50'
          }`}
        >
          <Star size={12} className={badgeFilter === 'featured' ? 'fill-white' : 'text-amber-500 fill-amber-500'} />
          Featured ({featuredCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setBadgeFilter(prev => prev === 'new_arrival' ? 'all' : 'new_arrival')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
            badgeFilter === 'new_arrival'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-indigo-50/50'
          }`}
        >
          <Sparkles size={12} className={badgeFilter === 'new_arrival' ? 'text-white' : 'text-indigo-500'} />
          New Arrivals ({newArrivalCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setBadgeFilter(prev => prev === 'flash_sale' ? 'all' : 'flash_sale')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
            badgeFilter === 'flash_sale'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-purple-50/50'
          }`}
        >
          <Zap size={12} className={badgeFilter === 'flash_sale' ? 'text-white fill-white' : 'text-purple-500 fill-purple-500'} />
          Flash Sale ({flashSaleCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(prev => prev === 'active' ? 'all' : 'active')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
            statusFilter === 'active'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-emerald-50/50'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active ({activeCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(prev => prev === 'inactive' ? 'all' : 'inactive')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
            statusFilter === 'inactive'
              ? 'bg-gray-800 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          Inactive
        </button>

        <button
          type="button"
          onClick={() => {
            setStockFilter(prev => prev === 'low_stock' ? 'all' : 'low_stock')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
            stockFilter === 'low_stock'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-red-50/50'
          }`}
        >
          <AlertTriangle size={12} className={stockFilter === 'low_stock' ? 'text-white' : 'text-red-500'} />
          Low Stock ({lowStockCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setStockFilter(prev => prev === 'out_of_stock' ? 'all' : 'out_of_stock')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
            stockFilter === 'out_of_stock'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-rose-50/50'
          }`}
        >
          <XCircle size={12} className={stockFilter === 'out_of_stock' ? 'text-white' : 'text-rose-600'} />
          Out of Stock ({outOfStockCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setImageFilter(prev => prev === 'placeholder' ? 'all' : 'placeholder')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition-all ${
            imageFilter === 'placeholder'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-amber-50/50'
          }`}
        >
          <ImageIcon size={12} className={imageFilter === 'placeholder' ? 'text-white' : 'text-amber-600'} />
          Placeholder Image
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3">
        {/* Top search & category row */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex-1 w-full relative">
            {isSearching ? (
              <RefreshCw className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
            ) : (
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            )}
            <Input
              type="text"
              placeholder={dict.products.searchPlaceholder}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-9 h-10 bg-gray-50/50 border-gray-200 focus:bg-white rounded-xl text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="w-full md:w-72">
            <CategoryDropdown
              categories={categories}
              value={categoryFilter}
              onChange={handleCategoryChange}
              placeholder={dict.products.filterByCategory}
              searchPlaceholder={dict.products.searchPlaceholder}
              clearable
              showPath
              showLevelIndicator={false}
            />
          </div>
        </div>

        {/* Detailed filter dropdowns row */}
        <div className="pt-2.5 border-t border-gray-100 flex flex-wrap gap-2.5 items-center justify-between">
          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Badge / Collection filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500">Badge:</span>
              <select
                value={badgeFilter}
                onChange={(e) => {
                  setBadgeFilter(e.target.value as any)
                  setPage(1)
                }}
                className="h-9 bg-gray-50/80 border border-gray-200 focus:bg-white rounded-xl text-xs px-2.5 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20"
              >
                <option value="all">All Badges</option>
                <option value="featured">⭐ Featured / Bestseller</option>
                <option value="new_arrival">✨ New Arrivals</option>
                <option value="flash_sale">⚡ Flash Sale</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any)
                  setPage(1)
                }}
                className="h-9 bg-gray-50/80 border border-gray-200 focus:bg-white rounded-xl text-xs px-2.5 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20"
              >
                <option value="all">All Status</option>
                <option value="active">🟢 Active Only</option>
                <option value="inactive">🔴 Inactive Only</option>
              </select>
            </div>

            {/* Stock filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500">Stock:</span>
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value as any)
                  setPage(1)
                }}
                className="h-9 bg-gray-50/80 border border-gray-200 focus:bg-white rounded-xl text-xs px-2.5 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20"
              >
                <option value="all">All Stock</option>
                <option value="in_stock">✅ In Stock (≥10)</option>
                <option value="low_stock">⚠️ Low Stock (&lt;10)</option>
                <option value="out_of_stock">🚫 Out of Stock (0)</option>
              </select>
            </div>

            {/* Photo filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500">Photo:</span>
              <select
                value={imageFilter}
                onChange={(e) => {
                  setImageFilter(e.target.value as any)
                  setPage(1)
                }}
                className="h-9 bg-gray-50/80 border border-gray-200 focus:bg-white rounded-xl text-xs px-2.5 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20"
              >
                <option value="all">All Photos</option>
                <option value="real">📸 Verified Real Photo</option>
                <option value="placeholder">⚠️ Placeholder / Needs Photo</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500">Sort:</span>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_')
                  setSortBy(field)
                  setSortOrder(order as any)
                  setPage(1)
                }}
                className="h-9 bg-gray-50/80 border border-gray-200 focus:bg-white rounded-xl text-xs px-2.5 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20"
              >
                <option value="createdAt_desc">🕒 Newest First</option>
                <option value="createdAt_asc">🕒 Oldest First</option>
                <option value="price_asc">💲 Price: Low to High</option>
                <option value="price_desc">💲 Price: High to Low</option>
                <option value="stock_asc">📦 Stock: Low to High</option>
                <option value="stock_desc">📦 Stock: High to Low</option>
                <option value="name_asc">🔤 Name: A to Z</option>
                <option value="updatedAt_desc">🔄 Recently Updated</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFilters}
              className="h-9 px-3 rounded-xl text-xs font-semibold text-rose-600 border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 hover:text-rose-700 shrink-0 gap-1"
            >
              <X size={12} />
              Reset All Filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Search & Filter Indicators */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
          <span className="text-gray-500 font-semibold text-[11px]">Active Filters ({totalCount} results):</span>

          {debouncedSearch.trim() && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
              <span>Search: &ldquo;{debouncedSearch.trim()}&rdquo;</span>
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="hover:text-blue-900 transition-colors ml-0.5"
                title="Clear search"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {categoryFilter && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">
              <span>Category filtered</span>
              <button
                type="button"
                onClick={() => handleCategoryChange(null)}
                className="hover:text-amber-900 transition-colors ml-0.5"
                title="Clear category filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {badgeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200/60">
              <span>
                Badge: {badgeFilter === 'featured' ? '⭐ Featured' : badgeFilter === 'new_arrival' ? '✨ New Arrival' : '⚡ Flash Sale'}
              </span>
              <button
                type="button"
                onClick={() => { setBadgeFilter('all'); setPage(1); }}
                className="hover:text-purple-900 transition-colors ml-0.5"
                title="Remove badge filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
              <span>Status: {statusFilter === 'active' ? '🟢 Active' : '🔴 Inactive'}</span>
              <button
                type="button"
                onClick={() => { setStatusFilter('all'); setPage(1); }}
                className="hover:text-emerald-900 transition-colors ml-0.5"
                title="Remove status filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {stockFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-semibold border border-red-200/60">
              <span>
                Stock: {stockFilter === 'in_stock' ? 'In Stock (≥10)' : stockFilter === 'low_stock' ? 'Low Stock (<10)' : 'Out of Stock (0)'}
              </span>
              <button
                type="button"
                onClick={() => { setStockFilter('all'); setPage(1); }}
                className="hover:text-red-900 transition-colors ml-0.5"
                title="Remove stock filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {imageFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200/60">
              <span>Photo: {imageFilter === 'real' ? 'Real Photo' : 'Placeholder Image'}</span>
              <button
                type="button"
                onClick={() => { setImageFilter('all'); setPage(1); }}
                className="hover:text-amber-950 transition-colors ml-0.5"
                title="Remove photo filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {(sortBy !== 'createdAt' || sortOrder !== 'desc') && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200/60">
              <span>Sort: {sortBy} ({sortOrder})</span>
              <button
                type="button"
                onClick={() => { setSortBy('createdAt'); setSortOrder('desc'); setPage(1); }}
                className="hover:text-gray-900 transition-colors ml-0.5"
                title="Reset sort"
              >
                <X size={12} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={resetAllFilters}
            className="text-[11px] font-bold text-gray-500 hover:text-gray-800 underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Products Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin border-t-[#1a3a5c]"></div>
          <p className="text-xs font-medium text-gray-500 mt-3">{dict.common.loading}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <Package size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{dict.common.noData}</h3>
          <p className="text-xs text-gray-500 mb-5 max-w-sm mx-auto">
            {debouncedSearch.trim()
              ? `No products found matching "${debouncedSearch.trim()}" across all products in the catalog.`
              : categoryFilter
              ? 'No products found in the selected category.'
              : dict.products.subtitle}
          </p>
          <div className="flex items-center justify-center gap-2">
            {(debouncedSearch.trim() || categoryFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setCategoryFilter(null)
                  setPage(1)
                  localStorage.removeItem('adminProductsFilters')
                }}
                className="text-xs font-semibold rounded-xl"
              >
                {dict.common.reset}
              </Button>
            )}
            <Button onClick={() => router.push('/admin/products/new')} className="bg-[#1a3a5c] text-white text-xs font-bold rounded-xl">
              <Plus size={14} className="mr-1.5" />
              {dict.products.addProduct}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-full">
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && products.every(p => selectedIds.includes(p.id))}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-4">{dict.products.productName}</th>
                    <th className="py-3.5 px-4">Item #</th>
                    <th className="py-3.5 px-4">{dict.common.price}</th>
                    <th className="py-3.5 px-4">{dict.products.stock}</th>
                    <th className="py-3.5 px-3 text-center">{dict.products.featured}</th>
                    <th className="py-3.5 px-3 text-center">{dict.products.newArrival}</th>
                    <th className="py-3.5 px-3 text-center">{dict.products.flashSale}</th>
                    <th className="py-3.5 px-4">{dict.common.status}</th>
                    {/* Sticky Right Action Header */}
                    <th className="py-3.5 px-5 text-center sticky right-0 z-20 bg-gray-100/95 backdrop-blur-xs border-l border-gray-200/90 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] min-w-[140px]">
                      {dict.common.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {products.map((product) => {
                    const localized = localizeProduct(product, locale)
                    const isSelected = selectedIds.includes(product.id)
                    const swedenName = getProductSwedenName(product)
                    const displayTitle = getProductDisplayTitle(localized.name)
                    return (
                      <tr key={product.id} className={`hover:bg-blue-50/30 transition-colors group ${isSelected ? 'bg-blue-50/40' : ''}`}>
                        {/* Checkbox */}
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(product.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Product Info */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3.5">
                            <ProductThumbnail src={product.thumbnail} alt={localized.name} productId={product.id} />
                            <div className="min-w-0">
                              {swedenName ? (
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span
                                    className="text-[10px] font-black text-amber-900 bg-amber-50/90 px-1.5 py-0.5 rounded border border-amber-200/70 uppercase tracking-wider inline-flex items-center gap-1"
                                    title="Swedish series / brand name"
                                  >
                                    <span className="text-[9px] font-bold text-amber-700/80">SWE:</span>
                                    <span>{swedenName}</span>
                                  </span>
                                </div>
                              ) : null}
                              <p
                                className="font-bold text-gray-900 truncate max-w-xs group-hover:text-[#1a3a5c] transition-colors"
                                title={localized.name}
                              >
                                {displayTitle}
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

                        {/* Identifiers (Dromkok Item #, IKEA Item #) */}
                        <td className="py-4 px-4 font-mono text-[11px] text-gray-600">
                          <div className="flex flex-col gap-1">
                            {product.dromkokItemNo ? (
                              <span
                                className="font-bold text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200/50 inline-block w-fit"
                                title="Dromkok Item #"
                              >
                                {product.dromkokItemNo}
                              </span>
                            ) : null}
                            {product.ikeaItemNo ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-1 py-0.5 rounded border border-amber-200/60">
                                  IKEA: {product.ikeaItemNo}
                                </span>
                                <a
                                  href={`https://www.ikea.com/us/en/p/-${product.ikeaItemNo.replace(/\D/g, '')}/`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 p-0.5 hover:bg-blue-50 rounded transition-colors"
                                  title={`Open original item ${product.ikeaItemNo} on IKEA.com`}
                                >
                                  <ExternalLink size={11} />
                                </a>
                              </div>
                            ) : null}
                            {!product.dromkokItemNo && !product.ikeaItemNo ? (
                              <span className="text-gray-400 text-[11px]">—</span>
                            ) : null}
                          </div>
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
                            {product.stock} {product.stock === 0 ? dict.products.outOfStock : dict.products.inStock}
                          </span>
                        </td>

                        {/* Featured Toggle */}
                        <td className="py-4 px-3 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={product.isFeatured}
                              onCheckedChange={() => handleToggleFeatured(product.id, product.isFeatured)}
                              title={dict.products.featured}
                            />
                          </div>
                        </td>

                        {/* New Arrival Toggle */}
                        <td className="py-4 px-3 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={product.isNewArrival}
                              onCheckedChange={() => handleToggleNewArrival(product.id, product.isNewArrival)}
                              title={dict.products.newArrival}
                            />
                          </div>
                        </td>

                        {/* Flash Sale Toggle */}
                        <td className="py-4 px-3 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={product.isFlashSale}
                              onCheckedChange={() => handleToggleFlashSale(product.id, product.isFlashSale)}
                              title={dict.products.flashSale}
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
                            {product.isActive ? dict.common.active : dict.common.inactive}
                          </button>
                        </td>

                        {/* Sticky Right Actions Column */}
                        <td className="py-4 px-5 text-right sticky right-0 z-10 bg-white/95 group-hover:bg-blue-50/95 backdrop-blur-xs border-l border-gray-200/90 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] transition-colors min-w-[140px]">
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={`/${locale}/products/${product.slug || product.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100/70 rounded-lg transition-colors"
                              title={dict.common.view}
                            >
                              <ExternalLink size={15} />
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                              className="p-1.5 h-auto text-gray-400 hover:text-emerald-600 hover:bg-emerald-100/70 rounded-lg transition-colors"
                              title={dict.common.edit}
                            >
                              <Edit size={15} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProductToDelete({ id: product.id, name: product.name })}
                              className="p-1.5 h-auto text-gray-400 hover:text-red-600 hover:bg-red-100/70 rounded-lg transition-colors"
                              title={dict.common.delete}
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
              const localized = localizeProduct(product, locale)
              const swedenName = getProductSwedenName(product)
              const displayTitle = getProductDisplayTitle(localized.name)
              return (
                <div key={product.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex gap-3.5">
                    <ProductThumbnail src={product.thumbnail} alt={localized.name} size="lg" productId={product.id} />
                    <div className="flex-1 min-w-0">
                      {swedenName ? (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="text-[10px] font-black text-amber-900 bg-amber-50/90 px-1.5 py-0.5 rounded border border-amber-200/70 uppercase tracking-wider inline-flex items-center gap-1"
                            title="Swedish series / brand name"
                          >
                            <span className="text-[9px] font-bold text-amber-700/80">SWE:</span>
                            <span>{swedenName}</span>
                          </span>
                        </div>
                      ) : null}
                      <h3 className="font-bold text-gray-900 text-sm truncate" title={localized.name}>
                        {displayTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[11px]">
                        {product.dromkokItemNo ? (
                          <span className="font-bold text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200/50">
                            {product.dromkokItemNo}
                          </span>
                        ) : null}
                        {product.ikeaItemNo ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-1 py-0.5 rounded border border-amber-200/60">
                              IKEA: {product.ikeaItemNo}
                            </span>
                            <a
                              href={`https://www.ikea.com/us/en/p/-${product.ikeaItemNo.replace(/\D/g, '')}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 p-0.5"
                              title={`Open original item ${product.ikeaItemNo} on IKEA.com`}
                            >
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        ) : null}
                        {!product.dromkokItemNo && !product.ikeaItemNo ? (
                          <span className="text-gray-400 text-[11px]">—</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-bold text-gray-900 text-sm">${Number(product.price).toFixed(2)}</span>
                        <span className="text-[11px] text-gray-500 font-medium">{dict.products.stock}: {product.stock}</span>
                      </div>
                      <TranslationBadges product={product} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50">
                      <span className="text-gray-500 font-medium">{dict.products.featured}</span>
                      <Switch
                        checked={product.isFeatured}
                        onCheckedChange={() => handleToggleFeatured(product.id, product.isFeatured)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50">
                      <span className="text-gray-500 font-medium">{dict.products.newArrival}</span>
                      <Switch
                        checked={product.isNewArrival}
                        onCheckedChange={() => handleToggleNewArrival(product.id, product.isNewArrival)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50">
                      <span className="text-gray-500 font-medium">{dict.common.active}</span>
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
                      {dict.common.edit}
                    </Button>
                    <a
                      href={`/${locale}/products/${product.slug || product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductToDelete({ id: product.id, name: product.name })}
                      className="px-3 rounded-xl text-red-600 hover:bg-red-50 hover:border-red-200"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination & Per-page View Controls */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                <span>
                  {limit === -1 || totalCount <= limit
                    ? `Showing all ${totalCount} products`
                    : `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, totalCount)} of ${totalCount} products`}
                </span>
                <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
                  <span className="text-[11px] text-gray-400">Per page:</span>
                  {[20, 50, 100].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setLimit(size)
                        setPage(1)
                      }}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                        limit === size
                          ? 'bg-[#1a3a5c] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setLimit(-1)
                      setPage(1)
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                      limit === -1
                        ? 'bg-[#1a3a5c] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 mr-1">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-xl text-xs font-semibold h-8 px-3"
                  >
                    <ChevronLeft size={14} className="mr-1" />
                    {dict.common.previous}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-xl text-xs font-semibold h-8 px-3"
                  >
                    {dict.common.next}
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Styled Delete Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-gray-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              <span>{dict.common.delete} {dict.products.productName}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-2">
              {dict.common.confirmDelete}
            </DialogDescription>
          </DialogHeader>

          {productToDelete && (
            <div className="my-3 p-3 bg-red-50/60 rounded-xl border border-red-100 text-xs font-medium text-gray-800">
              <p className="font-bold text-gray-900">{productToDelete.name}</p>
              <p className="text-gray-400 text-[11px] font-mono mt-0.5">ID: {productToDelete.id}</p>
            </div>
          )}

          <DialogFooter className="mt-4 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setProductToDelete(null)}
              className="rounded-xl text-xs font-semibold px-4 border-gray-200"
            >
              {dict.common.cancel}
            </Button>
            <Button
              size="sm"
              disabled={deleting}
              onClick={confirmDeleteProduct}
              className="rounded-xl text-xs font-bold px-4 bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-900/20"
            >
              {deleting ? dict.common.loading : dict.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 animate-in fade-in-50 slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-3 border-r border-white/20 text-xs font-bold">
            <CheckSquare size={16} className="text-emerald-400" />
            <span>
              {(dict.bulk?.selectedCount || '{count} selected').replace('{count}', selectedIds.length.toString())}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('TOGGLE_STATUS', true)}
              className="h-8 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {dict.bulk?.bulkActive || 'Set Active'}
            </Button>
            <Button
              size="sm"
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('TOGGLE_STATUS', false)}
              className="h-8 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
            >
              {dict.bulk?.bulkInactive || 'Set Inactive'}
            </Button>
            <Button
              size="sm"
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('DELETE')}
              className="h-8 px-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold gap-1"
            >
              <Trash2 size={13} />
              <span>{dict.bulk?.bulkDelete || 'Delete'}</span>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-1"
            title={dict.common.close}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

