'use client'

import React from 'react'
import { Check } from 'lucide-react'

export interface VariantOption {
  id: string
  name: string
  colorHex?: string
  inStock?: boolean
}

interface MobileVariantChipsProps {
  title: string
  variants: VariantOption[]
  selectedId: string
  onSelect: (variantId: string) => void
  className?: string
}

export function MobileVariantChips({
  title,
  variants,
  selectedId,
  onSelect,
  className = '',
}: MobileVariantChipsProps) {
  if (!variants || variants.length === 0) return null

  return (
    <div
      data-testid="mobile-variant-chips"
      className={`space-y-2 ${className}`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-gray-700 dark:text-slate-300">
          {title}
        </span>
        <span className="text-gray-400">
          {variants.find((v) => v.id === selectedId)?.name || 'Select'}
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {variants.map((variant) => {
          const isSelected = selectedId === variant.id
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant.id)}
              className={`min-h-[44px] px-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all active:scale-95 touch-manipulation shrink-0 ${
                isSelected
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-xs'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300'
              }`}
            >
              {variant.colorHex && (
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: variant.colorHex }}
                />
              )}
              <span>{variant.name}</span>
              {isSelected && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
