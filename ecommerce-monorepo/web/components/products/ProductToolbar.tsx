'use client'

import { Grid, List, SlidersHorizontal } from 'lucide-react'

interface ProductToolbarProps {
  totalProducts: number
  sortBy: string
  onSortChange: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onFilterToggle: () => void
}

export function ProductToolbar({
  totalProducts,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onFilterToggle,
}: ProductToolbarProps) {
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'popularity', label: 'Popularity' },
    { value: 'name-asc', label: 'Name: A-Z' },
    { value: 'name-desc', label: 'Name: Z-A' },
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-gray-200 bg-white rounded-lg px-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600 font-medium">
          {totalProducts} {totalProducts === 1 ? 'Product' : 'Products'}
        </span>
        <div className="hidden md:flex items-center space-x-1 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-[#1a3a5c] text-white' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'list' ? 'bg-[#1a3a5c] text-white' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Mobile Filter Toggle */}
        <button
          onClick={onFilterToggle}
          className="md:hidden flex items-center space-x-2 text-sm text-gray-600 hover:text-[#1a3a5c] border border-gray-200 rounded-lg px-3 py-2 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filter</span>
        </button>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] bg-white text-gray-700"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              Sort by: {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
