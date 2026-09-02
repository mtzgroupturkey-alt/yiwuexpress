'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { Container } from '@/components/ui/Container'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { FilterSidebar } from '@/components/products/FilterSidebar'
import ProductGrid from '@/components/products/ProductGrid'
import { ProductToolbar } from '@/components/products/ProductToolbar'
import { Pagination } from '@/components/products/Pagination'
import { useTranslations } from 'next-intl'

interface FilterMetadata {
  id: string
  name: string
  type: 'checkbox' | 'range' | 'color' | 'select'
  attributeSlug?: string
  options?: { label: string; value: string; count?: number }[]
  min?: number
  max?: number
}

interface Product {
  id: string
  slug: string
  name: string
  sku: string
  price: number
  compareAtPrice?: number | null
  thumbnail?: string | null
  stock: number
  isFeatured?: boolean
  isNew?: boolean
  rating?: number
  reviewCount?: number
  category?: {
    id: string
    name: string
    slug: string
  } | null
}

function ProductsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [filterSections, setFilterSections] = useState<FilterMetadata[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const productsPerPage = 12

  const categorySlug = searchParams.get('category')
  const searchQuery = searchParams.get('search')
  const locale = useLocale()
  const t = useTranslations('Products')
  const tt = t as unknown as (key: string, values?: Record<string, any>) => string

  // Parse page, sort, filters from URL
  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10)
    return isNaN(p) ? 1 : Math.max(1, p)
  }, [searchParams])

  const sortBy = useMemo(() => searchParams.get('sort') || 'relevance', [searchParams])

  const filters = useMemo(() => {
    const result: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      if (!key.startsWith('attr[')) return

      const rangeMatch = key.match(/^attr\[(.*?)\]\[(min|max)\]$/)
      if (rangeMatch) {
        const attrKey = rangeMatch[1]
        const type = rangeMatch[2]
        if (!result[attrKey]) result[attrKey] = {}
        result[attrKey][type] = parseFloat(value)
        return
      }

      const match = key.match(/^attr\[(.*?)\]$/)
      if (match) {
        result[match[1]] = value.split(',')
      }
    })
    return result
  }, [searchParams])

  // Fetch dynamic filter sections when category or locale changes
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const catParam = categorySlug ? `&category=${encodeURIComponent(categorySlug)}` : ''
        const response = await fetch(`/api/products?${catParam}&locale=${locale}&limit=1`)
        const data = await response.json()
        if (data.success && data.filters && data.filters.length > 0) {
          setFilterSections(data.filters)
        }
      } catch (error) {
        console.error('Error fetching filters:', error)
      }
    }
    fetchFilters()
  }, [categorySlug, locale])

  // Fetch category ID when categorySlug changes
  useEffect(() => {
    const fetchCategoryId = async () => {
      if (categorySlug) {
        try {
          const response = await fetch(`/api/categories?locale=${locale}`)
          const data = await response.json()
          if (data.success && data.data) {
            const category = data.data.find((cat: any) => cat.slug === categorySlug)
            setCategoryId(category?.id || null)
            setCategoryName(category?.name || null)
          }
        } catch (error) {
          console.error('Error fetching category:', error)
        }
      } else {
        setCategoryId(null)
        setCategoryName(null)
      }
    }
    fetchCategoryId()
  }, [categorySlug, locale])

  const fetchProducts = async (signal: AbortSignal) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: productsPerPage.toString(),
      })

      if (categorySlug) params.append('category', categorySlug)
      if (searchQuery) params.append('search', searchQuery)
      if (sortBy && sortBy !== 'relevance') params.append('sort', sortBy)

      // Add dynamic filters
      Object.entries(filters).forEach(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return
        if (Array.isArray(value)) {
          params.append(`attr[${key}]`, value.join(','))
        } else if (typeof value === 'object' && value !== null) {
          // Range filter: { min, max }
          if (value.min !== undefined) params.append(`attr[${key}][min]`, String(value.min))
          if (value.max !== undefined) params.append(`attr[${key}][max]`, String(value.max))
        } else {
          params.append(`attr[${key}]`, String(value))
        }
      })

      const response = await fetch(`/api/products?${params}&locale=${locale}`, { signal })
      const data = await response.json()

      if (data.success) {
        setProducts(data.data)
        setTotalProducts(data.pagination?.total || 0)
        setTotalPages(data.pagination?.pages || 1)
      } else {
        console.error('Failed to fetch products:', data.error)
        setProducts([])
        setTotalProducts(0)
        setTotalPages(1)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Error fetching products:', error)
      setProducts([])
      setTotalProducts(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  // Fetch when URL params change
  useEffect(() => {
    const controller = new AbortController()
    fetchProducts(controller.signal)
    return () => controller.abort()
  }, [currentPage, sortBy, filters, categorySlug, searchQuery, locale])

  // URL sync helpers
  const buildSearchParams = useCallback((overrides: Record<string, string | null> = {}) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    return params
  }, [searchParams])

  const handleSortChange = (value: string) => {
    const params = buildSearchParams({ sort: value === 'relevance' ? null : value, page: '1' })
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
  }

  const handleFilterChange = (newFilters: Record<string, any>) => {
    // Build params from newFilters
    const params = new URLSearchParams(searchParams.toString())
    // Remove all attr[] params
    const keysToDelete: string[] = []
    params.forEach((_, key) => {
      if (key.startsWith('attr[')) keysToDelete.push(key)
    })
    keysToDelete.forEach(k => params.delete(k))
    // Add new filter params
    Object.entries(newFilters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return
      if (Array.isArray(value)) {
        params.append(`attr[${key}]`, value.join(','))
      } else if (typeof value === 'object' && value !== null) {
        if (value.min !== undefined) params.append(`attr[${key}][min]`, String(value.min))
        if (value.max !== undefined) params.append(`attr[${key}][max]`, String(value.max))
      } else {
        params.append(`attr[${key}]`, String(value))
      }
    })
    params.set('page', '1')
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    const keysToDelete: string[] = []
    params.forEach((_, key) => {
      if (key.startsWith('attr[')) keysToDelete.push(key)
    })
    keysToDelete.forEach(k => params.delete(k))
    params.set('page', '1')
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = buildSearchParams({ page: String(page) })
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen)
  }

  const sectionNameKeys: Record<string, string> = {
    availability: 'filterAvailability',
    price: 'filterPrice',
    color: 'filterColor',
    material: 'filterMaterial',
    category: 'filterCategory',
  }

  const optionLabelKeys: Record<string, Record<string, string>> = {
    availability: { 'in-stock': 'optInStock', 'out-of-stock': 'optOutOfStock' },
    color: {
      '#e74c3c': 'colorRed', '#3498db': 'colorBlue', '#2c3e50': 'colorBlack',
      '#ecf0f1': 'colorWhite', '#d35400': 'colorCopper', '#95a5a6': 'colorSilver',
    },
    material: {
      'stainless-steel': 'matStainlessSteel', 'cast-iron': 'matCastIron',
      'aluminum': 'matAluminum', 'non-stick': 'matNonStick',
      'glass': 'matGlass', 'ceramic': 'matCeramic',
    },
    category: {
      'cookware': 'catCookware', 'bakeware': 'catBakeware',
      'kitchen-utensils': 'catKitchenUtensils', 'kitchen-appliances': 'catKitchenAppliances',
      'tableware': 'catTableware', 'storage-organization': 'catStorage',
    },
  }

  // Build static filter sections for fallback (when no category selected)
  const staticFilterSections = useMemo<FilterMetadata[]>(() => [
    {
      id: 'availability',
      name: t(sectionNameKeys.availability as any),
      type: 'checkbox',
      options: [
        { label: t(optionLabelKeys.availability['in-stock'] as any), value: 'in-stock' },
        { label: t(optionLabelKeys.availability['out-of-stock'] as any), value: 'out-of-stock' },
      ],
    },
    {
      id: 'price',
      name: t(sectionNameKeys.price as any),
      type: 'range',
      min: 0,
      max: 1000,
    },
    {
      id: 'color',
      name: t(sectionNameKeys.color as any),
      type: 'color',
      options: Object.entries(optionLabelKeys.color).map(([value, labelKey]) => ({
        label: t(labelKey as any),
        value,
      })),
    },
    {
      id: 'material',
      name: t(sectionNameKeys.material as any),
      type: 'checkbox',
      options: Object.entries(optionLabelKeys.material).map(([value, labelKey]) => ({
        label: t(labelKey as any),
        value,
      })),
    },
    {
      id: 'category',
      name: t(sectionNameKeys.category as any),
      type: 'checkbox',
      options: Object.entries(optionLabelKeys.category).map(([value, labelKey]) => ({
        label: t(labelKey as any),
        value,
      })),
    },
  ], [t])

  // Use dynamic filters from API if available, otherwise fall back to static
  const sectionsToRender = filterSections.length > 0 ? filterSections : staticFilterSections

  return (
    <SharedLayout
      pageTitle={categoryName || t('allProducts')}
      pageDescription={categoryName ? t('pageDescCategory', { name: categoryName }) : t('pageDescDefault')}
      breadcrumbs={[
        { name: t('breadcrumbHome'), href: `/${locale}` },
        { name: t('breadcrumbShop'), href: `/${locale}/products` },
        ...(categoryName ? [{ name: categoryName, href: `/${locale}/products?category=${categorySlug}` }] : []),
      ]}
    >
      <Container className="py-8 lg:py-12">
        {/* Error / Empty State */}
        {!loading && products.length === 0 && !totalProducts && (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noProductsFound')}</h3>
            <p className="text-gray-500 mb-6">{t('tryAdjusting')}</p>
            {Object.keys(filters).length > 0 && (
              <button
                onClick={handleClearFilters}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t('clearAllFilters')}
              </button>
            )}
          </div>
        )}

        {/* Products with Filters */}
        {(loading || products.length > 0 || totalProducts > 0) && (
          <>
            {/* Mobile Filter Toggle - separate from flex row */}
            <div className="lg:hidden mb-4">
              <button
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={handleFilterToggle}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18a1 1 0 001-1v-2.586a1 1 0 01.293-.707l6.414-6.414a1 1 0 00.293-.707V5l4-4v6.586a1 1 0 01.293.707l6.414 6.414a1 1 0 01-.293.707V17a1 1 0 01-1 1H10a1 1 0 00-1 1v2.586a1 1 0 01-.707.293l-6.414-6.414a1 1 0 00-.707-.293z" />
                  </svg>
                  {t('filter')}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="flex gap-6 lg:gap-8">
              {/* Sidebar Filters */}
              <aside className={`lg:w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden'} lg:block fixed lg:static inset-0 z-50 lg:z-auto bg-white lg:shadow-none lg:border-0 p-0 lg:p-4 overflow-y-auto max-h-[calc(100vh-4rem)] lg:max-h-none`}>
                <FilterSidebar
                  filters={sectionsToRender}
                  selectedFilters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  onClose={handleFilterToggle}
                  isMobile
                />
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Toolbar */}
                <ProductToolbar
                  totalProducts={totalProducts}
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  onFilterToggle={handleFilterToggle}
                />

                {/* Product Grid */}
                <ProductGrid
                  products={products}
                  columns={4}
                  viewMode={viewMode}
                  isLoading={loading}
                  onAddToCart={async (id) => {
                    // Handled by ProductCard
                  }}
                />

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </>
        )}
      </Container>
    </SharedLayout>
  )
}

export default function ProductsPage() {
  return <ProductsPageContent />
}