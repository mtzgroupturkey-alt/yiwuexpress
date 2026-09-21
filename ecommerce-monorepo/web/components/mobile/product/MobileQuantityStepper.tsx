'use client'

import React from 'react'
import { Plus, Minus } from 'lucide-react'

interface MobileQuantityStepperProps {
  quantity: number
  onChange: (qty: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function MobileQuantityStepper({
  quantity,
  onChange,
  min = 1,
  max = 9999,
  step = 1,
  className = '',
}: MobileQuantityStepperProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      onChange(Math.max(min, quantity - step))
    }
  }

  const handleIncrement = () => {
    if (quantity < max) {
      onChange(Math.min(max, quantity + step))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    if (isNaN(val)) return
    onChange(Math.min(max, Math.max(min, val)))
  }

  return (
    <div
      data-testid="mobile-quantity-stepper"
      className={`inline-flex items-center rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 p-1 ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
        className="min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-700 shadow-2xs flex items-center justify-center text-gray-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
      >
        <Minus className="w-4 h-4" />
      </button>

      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        aria-label="Product quantity"
        className="w-14 text-center font-bold text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        className="min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-700 shadow-2xs flex items-center justify-center text-gray-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}
