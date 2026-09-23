'use client'

import React from 'react'
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { Chip } from '../Chip'
import { useMobile } from '@/components/MobileProvider'

interface ActiveFilterItem {
  id: string
  label: string
}

interface MobileFilterChipsProps {
  onOpenFilters: () => void
  onOpenSort: () => void
  activeFiltersCount?: number
  currentSortLabel?: string
  activeFilters?: ActiveFilterItem[]
  onRemoveFilter?: (filterId: string) => void
  onClearAll?: () => void
  className?: string
}

export function MobileFilterChips({
  onOpenFilters,
  onOpenSort,
  activeFiltersCount = 0,
  currentSortLabel = 'Popular',
  activeFilters = [],
  onRemoveFilter,
  onClearAll,
  className = '',
}: MobileFilterChipsProps) {
  const { isStandalone } = useMobile()

  return (
    <div
      data-testid="mobile-filter-chips"
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar px-3 py-2 border-b border-gray-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md sticky z-20 ${
        isStandalone
          ? 'top-[calc(56px+env(safe-area-inset-top,0px))]'
          : 'top-[calc(120px+env(safe-area-inset-top,0px))]'
      } ${className}`}
    >
      {/* 1. Filter Trigger Button */}
      <button
        type="button"
        onClick={onOpenFilters}
        aria-label="Open Filters"
        className={`min-h-[40px] px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 touch-manipulation shrink-0 ${
          activeFiltersCount > 0
            ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
            : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters</span>
        {activeFiltersCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-white text-primary-600 text-[10px] font-black flex items-center justify-center">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* 2. Sort Trigger Button */}
      <button
        type="button"
        onClick={onOpenSort}
        aria-label="Open Sort"
        className="min-h-[40px] px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 active:scale-95 touch-manipulation shrink-0"
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span>{currentSortLabel}</span>
      </button>

      {/* 3. Active filter chips */}
      {activeFilters.map((af) => (
        <Chip
          key={af.id}
          label={af.label}
          selected={true}
          onRemove={onRemoveFilter ? () => onRemoveFilter(af.id) : undefined}
        />
      ))}

      {/* 4. Clear all */}
      {activeFilters.length > 1 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 underline whitespace-nowrap shrink-0 px-2 active:opacity-75"
        >
          Clear All
        </button>
      )}
    </div>
  )
}
