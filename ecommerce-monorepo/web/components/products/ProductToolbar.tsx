'use client'

import { Grid, List, SlidersHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('Products')
  const tt = t as unknown as (key: string) => string
  const sortOptions = [
    { value: 'relevance', label: 'sortRelevance' },
    { value: 'price-asc', label: 'sortPriceAsc' },
    { value: 'price-desc', label: 'sortPriceDesc' },
    { value: 'newest', label: 'sortNewest' },
    { value: 'popularity', label: 'sortPopularity' },
    { value: 'name-asc', label: 'sortNameAsc' },
    { value: 'name-desc', label: 'sortNameDesc' },
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-gray-200 bg-white rounded-lg px-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600 font-medium">
          {t('productCount', { n: totalProducts })}
        </span>
        <div className="hidden md:flex items-center space-x-1 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-[#1a3a5c] text-white' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title={t('gridView')}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'list' ? 'bg-[#1a3a5c] text-white' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title={t('listView')}
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
          <span>{t('filter')}</span>
        </button>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] bg-white text-gray-700"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {tt(option.label)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
