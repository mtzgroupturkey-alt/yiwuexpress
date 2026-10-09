'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Product, Category } from '@/app/[locale]/design-3/types'
import { MobileFilterChips } from './MobileFilterChips'
import { MobileFilters, FilterValues } from './MobileFilters'
import { MobileSort, SortOptionId } from './MobileSort'
import { MobileProductGrid } from './MobileProductGrid'

interface MobileStorePageProps {
  products: Product[]
  categories?: Category[]
  onAddToCart?: (product: Product, quantity?: number) => void
  onSelectProduct?: (product: Product) => void
  favoriteIds?: Set<string>
  onToggleFavorite?: (productId: string) => void
  initialCategory?: string | null
  initialDepartment?: string | null
  initialSearch?: string
  className?: string
  currentPage?: number
  onPageChange?: (page: number) => void
  totalPages?: number
  serverTotalCount?: number
  isLoading?: boolean
}

export function MobileStorePage({
  products,
  categories = [],
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  initialCategory,
  initialDepartment,
  initialSearch = '',
  className = '',
  currentPage,
  onPageChange,
  totalPages,
  serverTotalCount,
  isLoading = false,
}: MobileStorePageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [sortOption, setSortOption] = useState<SortOptionId>('popular')
  const [filters, setFilters] = useState<FilterValues>({
    category: initialCategory || undefined,
    department:
      initialDepartment &&
      initialDepartment !== 'All Departments' &&
      initialDepartment !== 'all'
        ? initialDepartment
        : undefined,
  })

  // URL -> State read-only sync
  useEffect(() => {
    const urlCategory = searchParams.get('category') || undefined
    const urlDepartment =
      searchParams.get('department') || searchParams.get('dept') || undefined
    const cleanedDept =
      urlDepartment &&
      urlDepartment !== 'All Departments' &&
      urlDepartment !== 'all'
        ? urlDepartment
        : undefined

    setFilters((prev) => {
      if (prev.category === urlCategory && prev.department === cleanedDept) {
        return prev
      }
      return {
        ...prev,
        category: urlCategory,
        department: cleanedDept,
      }
    })
  }, [searchParams])

  // Centralized URL navigation for Category/Department changes
  const handleCategoryNavigate = useCallback(
    (newCatSlugOrId?: string, newDept?: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (!newCatSlugOrId || newCatSlugOrId === 'all') {
        params.delete('category')
      } else {
        params.set('category', newCatSlugOrId)
      }

      if (newDept && newDept !== 'all' && newDept !== 'All Departments') {
        params.set('department', newDept)
      } else {
        params.delete('department')
      }

      params.delete('sub')
      params.delete('dept')
      params.delete('cat')
      params.delete('page') // Reset page on category/department change

      const queryString = params.toString()
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
    },
    [pathname, router, searchParams]
  )

  // Filtering products
  const filteredProducts = useMemo(() => {
    let list = [...products]

    // 1. Text search if present
    if (initialSearch.trim()) {
      const q = initialSearch.toLowerCase().trim()
      const cleanDigits = q.replace(/\D/g, '')
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.dromkokItemNo && (
            p.dromkokItemNo.toLowerCase().includes(q) ||
            (cleanDigits.length >= 4 && p.dromkokItemNo.replace(/\D/g, '').includes(cleanDigits))
          )) ||
          (p.ikeaItemNo && p.ikeaItemNo.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.article && p.article.toLowerCase().includes(q)) ||
          (p.swedenName && p.swedenName.toLowerCase().includes(q)) ||
          (p.englishName && p.englishName.toLowerCase().includes(q))
      )
    }

    // 2. Category filter
    if (filters.category) {
      const catLower = filters.category.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.categoryId === filters.category ||
          (p.category && p.category.toLowerCase().trim() === catLower) ||
          (p.department && p.department.toLowerCase().trim() === catLower) ||
          (p.categorySlug && p.categorySlug.toLowerCase().trim() === catLower) ||
          (p.category && p.category.toLowerCase().replace(/\s+/g, '-') === catLower)
      )
    }

    // 2b. Department filter (when not 'All Departments')
    if (filters.department && filters.department !== 'All Departments' && filters.department !== 'all') {
      const deptLower = filters.department.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.departmentId === filters.department ||
          (p.department && p.department.toLowerCase().trim() === deptLower) ||
          (p.category && p.category.toLowerCase().trim() === deptLower)
      )
    }

    // 3. Price filter
    if (filters.minPrice !== undefined) {
      list = list.filter((p) => p.price >= Number(filters.minPrice))
    }
    if (filters.maxPrice !== undefined) {
      list = list.filter((p) => p.price <= Number(filters.maxPrice))
    }

    // 4. In stock only
    if (filters.inStockOnly) {
      list = list.filter((p) => p.inStock)
    }

    // 5. Wholesale only
    if (filters.wholesaleOnly) {
      list = list.filter((p) => (p.moq && p.moq > 1) || (p.minOrderQty && p.minOrderQty > 1))
    }

    // 6. Rating
    if (filters.minRating) {
      list = list.filter((p) => (p.rating || 0) >= filters.minRating!)
    }

    // 7. Sort
    if (sortOption === 'price-asc') {
      list.sort((a, b) => a.price - b.price)
    } else if (sortOption === 'price-desc') {
      list.sort((a, b) => b.price - a.price)
    } else if (sortOption === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    return list
  }, [products, initialSearch, filters, sortOption])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.category) count++
    if (filters.department && filters.department !== 'All Departments' && filters.department !== 'all') count++
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++
    if (filters.inStockOnly) count++
    if (filters.wholesaleOnly) count++
    if (filters.minRating) count++
    return count
  }, [filters])

  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string }[] = []
    if (filters.category) {
      const catLower = filters.category.toLowerCase().trim()
      const foundCat = categories.find(
        (c) =>
          (c.slug && c.slug.toLowerCase() === catLower) ||
          (c.id && c.id.toLowerCase() === catLower) ||
          (c.name && c.name.toLowerCase() === catLower)
      )
      chips.push({
        id: 'category',
        label: foundCat?.name || filters.category,
      })
    }
    if (filters.department && filters.department !== 'All Departments' && filters.department !== 'all') {
      chips.push({
        id: 'department',
        label: filters.department,
      })
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      chips.push({
        id: 'price',
        label: `$${filters.minPrice || 0} - $${filters.maxPrice || '∞'}`,
      })
    }
    if (filters.inStockOnly) {
      chips.push({ id: 'inStock', label: 'In Stock' })
    }
    if (filters.wholesaleOnly) {
      chips.push({ id: 'wholesale', label: 'Wholesale Only' })
    }
    if (filters.minRating && filters.minRating > 0) {
      chips.push({ id: 'rating', label: `${filters.minRating}★+` })
    }
    return chips
  }, [filters, categories])

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === 'category') {
      handleCategoryNavigate(undefined, filters.department)
      return
    }
    if (filterId === 'department') {
      handleCategoryNavigate(filters.category, undefined)
      return
    }

    setFilters((prev) => {
      const next = { ...prev }
      if (filterId === 'price') {
        next.minPrice = undefined
        next.maxPrice = undefined
      }
      if (filterId === 'inStock') next.inStockOnly = false
      if (filterId === 'wholesale') next.wholesaleOnly = false
      if (filterId === 'rating') next.minRating = undefined
      return next
    })
  }

  const handleClearAll = () => {
    if (filters.category || filters.department) {
      handleCategoryNavigate(undefined, undefined)
    }
    setFilters({})
    setSortOption('popular')
  }

  const handleApplyFilters = (newFilters: FilterValues) => {
    if (
      newFilters.category !== filters.category ||
      newFilters.department !== filters.department
    ) {
      handleCategoryNavigate(newFilters.category, newFilters.department)
    }
    setFilters(newFilters)
  }

  const sortLabelMap: Record<SortOptionId, string> = {
    popular: 'Popular',
    'price-asc': 'Price ↑',
    'price-desc': 'Price ↓',
    rating: 'Top Rated',
    newest: 'Newest',
  }

  return (
    <div
      data-testid="mobile-store-page"
      className={`md:hidden flex flex-col min-h-[60vh] pb-12 ${className}`}
    >
      {/* Sticky Filter & Sort Chips Bar */}
      <MobileFilterChips
        onOpenFilters={() => setIsFiltersOpen(true)}
        onOpenSort={() => setIsSortOpen(true)}
        activeFiltersCount={activeFiltersCount}
        currentSortLabel={sortLabelMap[sortOption]}
        activeFilters={activeFilterChips}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
      />

      {/* Product Results Count & Status */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 dark:text-slate-400">
        <span>
          Showing <strong className="text-gray-900 dark:text-white">
            {typeof serverTotalCount === 'number' ? serverTotalCount : filteredProducts.length}
          </strong> products
        </span>
      </div>

      {/* 2-Column Product Grid */}
      <MobileProductGrid
        products={filteredProducts}
        isLoading={isLoading}
        onAddToCart={onAddToCart}
        onSelectProduct={onSelectProduct}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onResetFilters={handleClearAll}
      />

      {/* Mobile Pagination Controls */}
      {typeof totalPages === 'number' && totalPages > 1 && typeof onPageChange === 'function' && typeof currentPage === 'number' && (
        <div className="flex items-center justify-between px-4 py-4 mt-2 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      )}

      {/* Bottom Sheet Filter Dialog */}
      <MobileFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        categories={categories}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleClearAll}
      />

      {/* Bottom Sheet Sort Dialog */}
      <MobileSort
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        currentSort={sortOption}
        onSelectSort={(newSort) => setSortOption(newSort)}
      />
    </div>
  )
}
