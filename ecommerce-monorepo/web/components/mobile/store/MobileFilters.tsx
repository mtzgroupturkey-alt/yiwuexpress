'use client'

import React, { useState } from 'react'
import { BottomSheet } from '../BottomSheet'
import { Category } from '@/app/[locale]/design-3/types'
import { Check, RotateCcw } from 'lucide-react'

export interface FilterValues {
  category?: string
  minPrice?: number | string
  maxPrice?: number | string
  inStockOnly?: boolean
  wholesaleOnly?: boolean
  minRating?: number
}

interface MobileFiltersProps {
  isOpen: boolean
  onClose: () => void
  categories?: Category[]
  currentFilters: FilterValues
  onApplyFilters: (filters: FilterValues) => void
  onResetFilters: () => void
}

export function MobileFilters({
  isOpen,
  onClose,
  categories = [],
  currentFilters,
  onApplyFilters,
  onResetFilters,
}: MobileFiltersProps) {
  const [selectedCat, setSelectedCat] = useState<string>(
    currentFilters.category || ''
  )
  const [minPrice, setMinPrice] = useState<string>(
    currentFilters.minPrice ? String(currentFilters.minPrice) : ''
  )
  const [maxPrice, setMaxPrice] = useState<string>(
    currentFilters.maxPrice ? String(currentFilters.maxPrice) : ''
  )
  const [inStockOnly, setInStockOnly] = useState<boolean>(
    Boolean(currentFilters.inStockOnly)
  )
  const [wholesaleOnly, setWholesaleOnly] = useState<boolean>(
    Boolean(currentFilters.wholesaleOnly)
  )
  const [minRating, setMinRating] = useState<number>(
    currentFilters.minRating || 0
  )

  const handleApply = () => {
    onApplyFilters({
      category: selectedCat || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStockOnly,
      wholesaleOnly,
      minRating: minRating || undefined,
    })
    onClose()
  }

  const handleReset = () => {
    setSelectedCat('')
    setMinPrice('')
    setMaxPrice('')
    setInStockOnly(false)
    setWholesaleOnly(false)
    setMinRating(0)
    onResetFilters()
    onClose()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Products"
      subtitle="Refine products by category, price & origin"
    >
      <div className="space-y-5 pb-6 text-sm">
        {/* 1. Category */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Category
            </h4>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setSelectedCat('')}
                className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold border active:scale-95 transition-transform ${
                  selectedCat === ''
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setSelectedCat(
                      selectedCat === (cat.slug || cat.id)
                        ? ''
                        : cat.slug || cat.id
                    )
                  }
                  className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold border active:scale-95 transition-transform ${
                    selectedCat === (cat.slug || cat.id)
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Price Range */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Price Range ($)
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min ($)"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-11 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white"
            />
            <input
              type="number"
              placeholder="Max ($)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-11 px-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* 3. Toggles */}
        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-800">
          <label className="flex items-center justify-between cursor-pointer py-1">
            <span className="font-semibold text-gray-800 dark:text-slate-200">
              In Stock Only
            </span>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer py-1">
            <span className="font-semibold text-gray-800 dark:text-slate-200">
              Wholesale / Container Volume Deals
            </span>
            <input
              type="checkbox"
              checked={wholesaleOnly}
              onChange={(e) => setWholesaleOnly(e.target.checked)}
              className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
            />
          </label>
        </div>

        {/* 4. Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 min-h-[48px] px-4 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All</span>
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-2 min-h-[48px] px-5 rounded-2xl bg-primary-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-transform"
          >
            <Check className="w-4 h-4" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
