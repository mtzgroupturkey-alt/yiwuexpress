'use client'

import React, { useEffect } from 'react'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { useSettings } from '@/components/SettingsProvider'

interface QuantitySelectorProps {
  quantity: number
  minOrderQty?: number
  onChange: (value: number) => void
  className?: string
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  minOrderQty = 1,
  onChange,
  className = '',
}) => {
  const { isWholesaleOnly } = useSettings()

  // In wholesale mode the floor is the product's MOQ, matching the backend
  // fallback rule (product.minOrderQty || 1). Otherwise the floor is 1.
  const effectiveMin = isWholesaleOnly ? minOrderQty || 1 : 1

  // Enforce the boundary when the mode (or value) changes.
  useEffect(() => {
    if (quantity < effectiveMin) {
      onChange(effectiveMin)
    }
  }, [effectiveMin, quantity, onChange])

  const handleDecrement = () => {
    if (quantity > effectiveMin) {
      onChange(quantity - 1)
    }
  }

  const handleIncrement = () => {
    onChange(quantity + 1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    if (isNaN(val)) return
    // Normalize up to the floor if the typed value is below it.
    onChange(val < effectiveMin ? effectiveMin : val)
  }

  const handleBlur = () => {
    if (quantity < effectiveMin) {
      onChange(effectiveMin)
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white w-fit shadow-sm">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={quantity <= effectiveMin}
          className="px-3 py-2 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-r border-gray-200"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={quantity}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="w-16 text-center focus:outline-none text-sm font-semibold text-gray-800"
        />

        <button
          type="button"
          onClick={handleIncrement}
          className="px-3 py-2 text-gray-500 hover:bg-gray-50 transition-colors border-l border-gray-200"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isWholesaleOnly && (
        <p className="text-[11px] font-medium text-amber-600 flex items-center gap-1 mt-0.5">
          <ShoppingBag className="w-3 h-3" />
          Wholesale Minimum Order Quantity (MOQ): {effectiveMin} units
        </p>
      )}
    </div>
  )
}
