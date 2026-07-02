'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { FilterSidebar } from '@/components/products/FilterSidebar'
import ProductGrid from '@/components/products/ProductGrid'
import { ProductToolbar } from '@/components/products/ProductToolbar'
import { Pagination } from '@/components/products/Pagination'

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

// Filter configuration
const filterSections = [
  {
    id: 'availability',
    name: 'Availability',
    type: 'checkbox' as const,
    options: [
      { label: 'In Stock', value: 'in-stock' },
      { label: 'Out of Stock', value: 'out-of-stock' },
    ],
  },
  {
    id: 'price',
    name: 'Price',
    type: 'range' as const,
    min: 0,
    max: 200,
  },
  {
    id: 'color',
    name: 'Color',
    type: 'color' as const,
    options: [
      { label: 'Red', value: '#e74c3c' },
      { label: 'Blue', value: '#3498db' },
      { label: 'Black', value: '#2c3e50' },
      { label: 'White', value: '#ecf0f1' },
      { label: 'Copper', value: '#d35400' },
      { label: 'Silver', value: '#95a5a6' },
    ],
  },
  {
    id: 'material',
    name: 'Material',
    type: 'checkbox' as const,
    options: [
      { label: 'Stainless Steel', value: 'stainless-steel' },
      { label: 'Cast Iron', value: 'cast-iron' },
      { label: 'Aluminum', value: 'aluminum' },
      { label: 'Non-Stick', value: 'non-stick' },
      { label: 'Glass', value: 'glass' },
      { label: 'Ceramic', value: 'ceramic' },
    ],
  },
  {
    id: 'category',
    name: 'Category',
    type: 'checkbox' as const,
    options: [
      { label: 'Cookware', value: 'cookware' },
      { label: 'Bakeware', value: 'bakeware' },
      { label: 'Kitchen Utensils', value: 'kitchen-utensils' },
      { label: 'Kitchen Appliances', value: 'kitchen-appliances' },
      { label: 'Tableware', value: 'tableware' },
      { label: 'Storage', value: 'storage-organization' },
    ],
  },
]

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('relevance')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const productsPerPage = 12

  const categorySlug = searchParams.get('category')
  const searchQuery = searchParams.get('search')

  useEffect(() => {
    fetchProducts()
  }, [currentPage, sortBy, filters, categorySlug, searchQuery])

  // Fetch category ID when categorySlug changes
  useEffect(() => {
    const fetchCategoryId = async () => {
      if (categorySlug) {
        try {
          const response = await fetch(`/api/categories`)
          const data = await response.json()
          if (data.success && data.data) {
            const category = data.data.find((cat: any) => cat.slug === categorySlug)
            setCategoryId(category?.id || null)
            setCategoryName(category?.name || null)
            console.log('Found category for breadcrumb:', category)
          }
        } catch (error) {
          console.error('Error fetching category for breadcrumb:', error)
          setCategoryId(null)
          setCategoryName(null)
        }
      } else {
        setCategoryId(null)
        setCategoryName(null)
      }
    }
    
    fetchCategoryId()
  }, [categorySlug])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: productsPerPage.toString(),
      })

      if (categorySlug) params.append('category', categorySlug)
      if (searchQuery) params.append('search', searchQuery)
      if (sortBy && sortBy !== 'relevance') params.append('sort', sortBy)

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.data || [])
        setTotalPages(data.pagination?.pages || 1)
        setTotalProducts(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleClearFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Get category name for breadcrumb and header
  const getCategoryName = () => {
    if (categorySlug && categoryName) {
      return categoryName
    }
    if (searchQuery) {
      return `Search Results for "${searchQuery}"`
    }
    return 'All Products'
  }

  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/products' },
  ]

  // Add category-specific breadcrumb if present
  if (categorySlug && categoryName) {
    breadcrumbItems.push(
      { name: getCategoryName(), href: `/products?category=${categorySlug}` }
    )
  }

  const pageTitle = getCategoryName()
  const pageDescription = searchQuery 
    ? `Found ${totalProducts} products matching your search`
    : categorySlug
    ? `Explore our collection of ${getCategoryName().toLowerCase()}`
    : 'Discover quality kitchenware and kitchen essentials for your home or business'

  return (
    <SharedLayout 
      pageTitle={pageTitle}
      pageDescription={pageDescription}
      breadcrumbs={breadcrumbItems}
      categoryId={categoryId}
    >
      <div className="bg-gray-50 py-8">
        <Container maxWidth="2xl">

          {/* Toolbar */}
          <ProductToolbar
            totalProducts={totalProducts}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onFilterToggle={() => setIsFilterOpen(true)}
          />

          {/* Main Content */}
          <div className="flex flex-col md:flex-row gap-6 mt-6">
            {/* Filter Sidebar - Desktop */}
            <div className="hidden md:block w-64 flex-shrink-0">
              <FilterSidebar
                filters={filterSections}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>

            {/* Filter Sidebar - Mobile (Overlay) */}
            {isFilterOpen && (
              <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsFilterOpen(false)}>
                <div 
                  className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-gray-50 overflow-y-auto p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FilterSidebar
                    filters={filterSections}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    onClose={() => setIsFilterOpen(false)}
                    isMobile
                  />
                </div>
              </div>
            )}

            {/* Product Grid */}
            <div className="flex-1">
              <ProductGrid 
                products={products} 
                viewMode={viewMode}
                isLoading={loading}
                columns={4}
              />

              {/* Empty State */}
              {!loading && products.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-400 mb-4">
                    <svg 
                      className="w-24 h-24 mx-auto" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Products Found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {Object.keys(filters).length > 0 || searchQuery
                      ? "Try adjusting your filters or search query"
                      : "Check back soon for new products"}
                  </p>
                  {(Object.keys(filters).length > 0 || searchQuery) && (
                    <button
                      onClick={handleClearFilters}
                      className="text-[#1a3a5c] font-medium hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}

              {/* Pagination */}
              {!loading && products.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </Container>
      </div>
    </SharedLayout>
  )
}
