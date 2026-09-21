'use client'

import React from 'react'
import { BottomSheet } from '../BottomSheet'
import { Check } from 'lucide-react'

export type SortOptionId =
  | 'popular'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'newest'

export interface SortOption {
  id: SortOptionId
  label: string
  description?: string
}

interface MobileSortProps {
  isOpen: boolean
  onClose: () => void
  currentSort: SortOptionId
  onSelectSort: (sortId: SortOptionId) => void
}

const SORT_OPTIONS: SortOption[] = [
  { id: 'popular', label: 'Most Popular', description: 'Recommended best match' },
  { id: 'price-asc', label: 'Price: Low to High', description: 'Lowest pricing first' },
  { id: 'price-desc', label: 'Price: High to Low', description: 'Premium equipment first' },
  { id: 'rating', label: 'Highest Customer Rating', description: '4.5 stars and above' },
  { id: 'newest', label: 'Newest Arrivals', description: 'Fresh factory drops' },
]

export function MobileSort({
  isOpen,
  onClose,
  currentSort,
  onSelectSort,
}: MobileSortProps) {
  const handleSelect = (id: SortOptionId) => {
    onSelectSort(id)
    onClose()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Sort Products"
      subtitle="Select product ordering criteria"
    >
      <div className="space-y-1 pb-6">
        {SORT_OPTIONS.map((opt) => {
          const isSelected = currentSort === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              className={`w-full min-h-[52px] px-4 py-2.5 rounded-2xl flex items-center justify-between transition-colors text-left active:scale-98 ${
                isSelected
                  ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold'
                  : 'hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-800 dark:text-slate-200 font-medium'
              }`}
            >
              <div>
                <p className="text-sm leading-tight">{opt.label}</p>
                {opt.description && (
                  <p className="text-[11px] text-gray-400 dark:text-slate-400 font-normal mt-0.5">
                    {opt.description}
                  </p>
                )}
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}
