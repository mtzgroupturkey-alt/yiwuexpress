'use client'

import React, { useState, useMemo } from 'react'
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
  initialSearch?: string
  className?: string
}

export function MobileStorePage({
  products,
  categories = [],
  onAddToCart,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  initialCategory,
  initialSearch = '',
  className = '',
}: MobileStorePageProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [sortOption, setSortOption] = useState<SortOptionId>('popular')
  const [filters, setFilters] = useState<FilterValues>({
    category: initialCategory || undefined,
  })

  // Filtering products
  const filteredProducts = useMemo(() => {
    let list = [...products]

    // 1. Text search if present
    if (initialSearch.trim()) {
      const q = initialSearch.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      )
    }

    // 2. Category filter
    if (filters.category) {
      const catLower = filters.category.toLowerCase()
      list = list.filter(
        (p) =>
          (p.category && p.category.toLowerCase() === catLower) ||
          (p.department && p.department.toLowerCase() === catLower) ||
          (p.categorySlug && p.categorySlug.toLowerCase() === catLower)
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
      list = list.filter((p) => p.moq && p.moq > 1)
    }

    // 6. Rating
    if (filters.minRating) {
      list = list.filter((p) => p.rating >= filters.minRating!)
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
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++
    if (filters.inStockOnly) count++
    if (filters.wholesaleOnly) count++
    if (filters.minRating) count++
    return count
  }, [filters])

  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string }[] = []
    if (filters.category) {
      const foundCat = categories.find(
        (c) => (c.slug || c.id) === filters.category
      )
      chips.push({
        id: 'category',
        label: foundCat?.name || filters.category,
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
    return chips
  }, [filters, categories])

  const handleRemoveFilter = (filterId: string) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (filterId === 'category') next.category = undefined
      if (filterId === 'price') {
        next.minPrice = undefined
        next.maxPrice = undefined
      }
      if (filterId === 'inStock') next.inStockOnly = false
      if (filterId === 'wholesale') next.wholesaleOnly = false
      return next
    })
  }

  const handleClearAll = () => {
    setFilters({})
    setSortOption('popular')
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
          Showing <strong className="text-gray-900 dark:text-white">{filteredProducts.length}</strong> products
        </span>
      </div>

      {/* 2-Column Product Grid */}
      <MobileProductGrid
        products={filteredProducts}
        onAddToCart={onAddToCart}
        onSelectProduct={onSelectProduct}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onResetFilters={handleClearAll}
      />

      {/* Bottom Sheet Filter Dialog */}
      <MobileFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        categories={categories}
        currentFilters={filters}
        onApplyFilters={(newFilters) => setFilters(newFilters)}
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
