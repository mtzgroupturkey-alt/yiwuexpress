'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Plus, Search, Edit, Trash2, Eye, Package, Star, Sparkles } from 'lucide-react'
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'

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
  category?: {
    name: string
  } | null
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
  const limit = 20

  // Load filters from localStorage on mount
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

  // Helper function to flatten nested categories
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

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (filtersLoaded) {
      const filters = {
        search,
        categoryFilter,
        page
      }
      localStorage.setItem('adminProductsFilters', JSON.stringify(filters))
    }
  }, [search, categoryFilter, page, filtersLoaded])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    // Only fetch products after filters are loaded from localStorage
    if (filtersLoaded) {
      fetchProducts()
    }
  }, [page, search, categoryFilter, filtersLoaded])
  
  // Re-fetch products when categories finish loading (if a filter is active)
  useEffect(() => {
    if (flatCategories.length > 0 && categoryFilter) {
      fetchProducts()
    }
  }, [flatCategories.length])

  const fetchCategories = async () => {
    try {
      // Request categories with children included
      const response = await fetch('/api/categories?includeChildren=true')
      const data = await response.json()
      console.log('Categories response:', data)
      if (data.success) {
        const cats = data.data || []
        setCategories(cats)
        // Flatten the nested structure for easy lookup
        const flattened = flattenCategories(cats)
        console.log('Flattened categories:', flattened)
        setFlatCategories(flattened)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      // Convert category ID to slug if categoryFilter is set
      let categorySlug = null
      if (categoryFilter) {
        // Wait for categories to load if they haven't yet
        if (flatCategories.length === 0) {
          console.log('Categories not loaded yet, waiting...')
          setLoading(false)
          return
        }
        
        const category = flatCategories.find(c => c.id === categoryFilter)
        categorySlug = category?.slug || null
        console.log('Category Filter:', {
          categoryFilter,
          foundCategory: category,
          categorySlug,
          totalFlatCategories: flatCategories.length
        })
        
        if (!categorySlug) {
          console.error('Category not found in flat categories!')
        }
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(categorySlug && { category: categorySlug })
      })

      console.log('Fetching products with params:', params.toString())
      const response = await fetch(`/api/admin/products?${params}`)
      const data = await response.json()

      console.log('Products response:', {
        total: data.pagination?.total,
        count: data.data?.length,
        hasCategory: !!categorySlug
      })

      if (data.success) {
        setProducts(data.data || [])
        setTotalPages(data.pagination?.pages || 1)
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
        alert('Product deleted successfully')
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
      alert('Failed to update product')
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
      alert('Failed to update featured status')
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
      alert('Failed to update new arrival status')
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
      alert('Failed to update flash sale status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">
            Manage your product catalog
            {(search || categoryFilter) && (
              <span className="ml-2 text-sm text-primary">
                • Filters active
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => router.push('/admin/products/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
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
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first product</p>
            <Button onClick={() => router.push('/admin/products/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Arrival
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flash Sale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded">
                          {product.thumbnail ? (
                            <img
                              src={product.thumbnail}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center text-gray-400">
                              📦
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.category && (
                            <div className="text-sm text-gray-500">
                              {product.category.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${product.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        product.stock === 0 ? 'text-red-600' :
                        product.stock < 10 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {product.stock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={product.isFeatured}
                          onCheckedChange={() => handleToggleFeatured(product.id, product.isFeatured)}
                          title={product.isFeatured ? 'Remove from Featured' : 'Add to Featured'}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={product.isNewArrival}
                          onCheckedChange={() => handleToggleNewArrival(product.id, product.isNewArrival)}
                          title={product.isNewArrival ? 'Remove from New Arrivals' : 'Add to New Arrivals'}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={product.isFlashSale}
                          onCheckedChange={() => handleToggleFlashSale(product.id, product.isFlashSale)}
                          title={product.isFlashSale ? 'Remove from Flash Sales' : 'Add to Flash Sales'}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        <Badge variant={product.isActive ? 'success' : 'secondary'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/products/${product.slug}`)}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="h-16 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 flex items-center justify-center text-2xl">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Stock: {product.stock}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Badge variant={product.isActive ? 'success' : 'secondary'} className="text-xs">
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {product.isFeatured && (
                          <Badge variant="default" className="text-xs flex items-center gap-1">
                            <Star className="w-3 h-3" /> Featured
                          </Badge>
                        )}
                        {product.isNewArrival && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-gray-400" />
                      <Switch
                        checked={product.isFeatured}
                        onCheckedChange={() => handleToggleFeatured(product.id, product.isFeatured)}
                      />
                      <span className="text-xs text-gray-600">Featured</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gray-400" />
                      <Switch
                        checked={product.isNewArrival}
                        onCheckedChange={() => handleToggleNewArrival(product.id, product.isNewArrival)}
                      />
                      <span className="text-xs text-gray-600">New</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id, product.name)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
