'use client'

import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductFiltersProps {
  categories: Category[]
  onFilterChange: (filters: {
    search?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
  }) => void
}

export function ProductFilters({ categories, onFilterChange }: ProductFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')

  const handleApplyFilters = () => {
    onFilterChange({
      search: search || undefined,
      category: category || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sort
    })
  }

  const handleClearFilters = () => {
    setSearch('')
    setCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
    onFilterChange({})
  }

  useEffect(() => {
    // Auto-apply filters when search or sort changes
    const timer = setTimeout(() => {
      handleApplyFilters()
    }, 500)
    return () => clearTimeout(timer)
  }, [search, sort])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      {/* Search and Sort Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-48">
            <option value="newest">Newest First</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </Select>
          
          <Button
            variant="outline"
            size="default"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <Label htmlFor="category" className="mb-2 block">Category</Label>
              <Select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Min Price Filter */}
            <div>
              <Label htmlFor="minPrice" className="mb-2 block">Min Price ($)</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            {/* Max Price Filter */}
            <div>
              <Label htmlFor="maxPrice" className="mb-2 block">Max Price ($)</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="999999"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
