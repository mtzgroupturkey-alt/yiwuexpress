'use client'

import { Grid, List, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
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
    { value: 'popularity', label: 'sortPopularity' },
    { value: 'price-asc', label: 'sortPriceAsc' },
    { value: 'price-desc', label: 'sortPriceDesc' },
    { value: 'newest', label: 'sortNewest' },
  ]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 mb-6 bg-white dark:bg-[#0B1524] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {/* Product count & Active Filters */}
      <div className="flex items-center gap-3">
        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold">
          {t('productCount', { n: totalProducts })}
        </span>

        {/* Mobile Filter Toggle Button */}
        <button
          onClick={onFilterToggle}
          className="lg:hidden flex items-center gap-1.5 text-xs font-bold text-[#0055A4] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl px-3 py-1.5 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{t('filter')}</span>
        </button>
      </div>

      {/* Sorting & View Mode Switcher */}
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0055A4] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {tt(option.label)}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode (Grid vs List) */}
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#0055A4] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={t('gridView')}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#0055A4] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={t('listView')}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
