'use client'

import React, { useState, useEffect } from 'react'
import { BottomSheet } from '../BottomSheet'
import { Category } from '@/app/[locale]/design-3/types'
import { Check, RotateCcw, Star } from 'lucide-react'

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
    currentFilters.minPrice !== undefined && currentFilters.minPrice !== ''
      ? String(currentFilters.minPrice)
      : ''
  )
  const [maxPrice, setMaxPrice] = useState<string>(
    currentFilters.maxPrice !== undefined && currentFilters.maxPrice !== ''
      ? String(currentFilters.maxPrice)
      : ''
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

  // Synchronize internal state whenever the filter modal opens or current filters change
  useEffect(() => {
    if (isOpen) {
      setSelectedCat(currentFilters.category || '')
      setMinPrice(
        currentFilters.minPrice !== undefined && currentFilters.minPrice !== ''
          ? String(currentFilters.minPrice)
          : ''
      )
      setMaxPrice(
        currentFilters.maxPrice !== undefined && currentFilters.maxPrice !== ''
          ? String(currentFilters.maxPrice)
          : ''
      )
      setInStockOnly(Boolean(currentFilters.inStockOnly))
      setWholesaleOnly(Boolean(currentFilters.wholesaleOnly))
      setMinRating(currentFilters.minRating || 0)
    }
  }, [isOpen, currentFilters])

  const handleApply = () => {
    onApplyFilters({
      category: selectedCat || undefined,
      minPrice: minPrice !== '' ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
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
      subtitle="Refine products by category, price & rating"
      maxHeight="max-h-[85vh]"
    >
      <div className="flex flex-col h-full max-h-[75vh]">
        {/* Scrollable filter sections */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 text-sm">
          {/* 1. Category */}
          {categories.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Category
                </h4>
                {selectedCat && (
                  <button
                    type="button"
                    onClick={() => setSelectedCat('')}
                    className="text-xs text-[#00407a] dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 py-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedCat('')}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                    selectedCat === ''
                      ? 'bg-[#00407a] border-[#00407a] text-white shadow-xs'
                      : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-300'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => {
                  const catIdentifier = cat.slug || cat.id
                  const isSelected =
                    selectedCat.toLowerCase() === catIdentifier.toLowerCase() ||
                    selectedCat.toLowerCase() === cat.name.toLowerCase() ||
                    selectedCat === cat.id

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setSelectedCat(isSelected ? '' : catIdentifier)
                      }
                      className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#00407a] border-[#00407a] text-white shadow-xs'
                          : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-300'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {cat.itemCount != null && cat.itemCount > 0 && (
                        <span
                          className={`text-[10px] ${
                            isSelected ? 'text-blue-200' : 'text-gray-400 dark:text-slate-500'
                          }`}
                        >
                          ({cat.itemCount})
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 2. Price Range */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Price Range ($)
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs">$</span>
                <input
                  type="number"
                  placeholder="Min ($)"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full h-11 pl-7 pr-3 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white font-medium focus:border-[#00407a] focus:outline-none"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-xs">$</span>
                <input
                  type="number"
                  placeholder="Max ($)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full h-11 pl-7 pr-3 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white font-medium focus:border-[#00407a] focus:outline-none"
                />
              </div>
            </div>
            {/* Quick price chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: '< $50', min: '', max: '50' },
                { label: '$50 - $200', min: '50', max: '200' },
                { label: '$200 - $500', min: '200', max: '500' },
                { label: '$500+', min: '500', max: '' },
              ].map((preset) => {
                const isActive = minPrice === preset.min && maxPrice === preset.max
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setMinPrice('')
                        setMaxPrice('')
                      } else {
                        setMinPrice(preset.min)
                        setMaxPrice(preset.max)
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border active:scale-95 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-[#00407a] text-[#00407a] dark:text-blue-300 font-bold'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Customer Rating */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Customer Rating
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'All', value: 0 },
                { label: '3.0★+', value: 3 },
                { label: '4.0★+', value: 4 },
                { label: '4.5★+', value: 4.5 },
              ].map((r) => {
                const isSelected = minRating === r.value
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => setMinRating(isSelected && r.value !== 0 ? 0 : r.value)}
                    className={`min-h-[38px] rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00407a] border-[#00407a] text-white shadow-xs'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {r.value > 0 && (
                      <Star
                        className={`w-3 h-3 ${
                          isSelected ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'
                        }`}
                      />
                    )}
                    <span>{r.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Availability & Wholesale Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Availability & Mode
            </h4>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-xs text-gray-900 dark:text-white block">
                  In Stock Only
                </span>
                <span className="text-[11px] text-gray-500 dark:text-slate-400 block">
                  Exclude out-of-stock items
                </span>
              </div>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-5 h-5 rounded text-[#00407a] focus:ring-[#00407a] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-xs text-gray-900 dark:text-white block">
                  Wholesale / Container Volume Deals
                </span>
                <span className="text-[11px] text-gray-500 dark:text-slate-400 block">
                  Products with bulk MOQ pricing
                </span>
              </div>
              <input
                type="checkbox"
                checked={wholesaleOnly}
                onChange={(e) => setWholesaleOnly(e.target.checked)}
                className="w-5 h-5 rounded text-[#00407a] focus:ring-[#00407a] cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* 5. Pinned Action Buttons */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-sm shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 min-h-[46px] px-4 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-2 min-h-[46px] px-5 rounded-xl bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
