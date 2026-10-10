'use client'

import React from 'react'
import { useAdminCurrency } from '@/app/admin/contexts/AdminCurrencyContext'
import { CurrencySymbol } from '@/components/ui/CurrencySymbol'

export interface AdminPriceProps {
  amount: number
  className?: string
  symbolClassName?: string
  options?: {
    showSymbol?: boolean
    decimalPlaces?: number
  }
}

/**
 * AdminPrice Component
 * Formats a base USD price according to the active admin currency.
 * Automatically renders the official SVG icon for BYN (National Bank of Belarus)
 * matching the public storefront design.
 */
export function AdminPrice({
  amount,
  className = '',
  symbolClassName,
  options,
}: AdminPriceProps) {
  const { currentCurrency, rate } = useAdminCurrency()

  if (typeof amount !== 'number' || isNaN(amount)) {
    return <span className={className}>0.00</span>
  }

  const converted = amount * (rate || 1.0)
  const decimals = options?.decimalPlaces ?? currentCurrency.decimalPlaces ?? 2
  const formattedNumber = converted.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  if (options?.showSymbol === false) {
    return <span className={className}>{formattedNumber}</span>
  }

  const isByn = currentCurrency.code === 'BYN'
  const symbolElement = (
    <CurrencySymbol
      code={currentCurrency.code}
      symbol={isByn ? undefined : (currentCurrency.symbol || currentCurrency.code)}
      className={symbolClassName}
    />
  )

  if (currentCurrency.symbolPosition === 'after') {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span>{formattedNumber}</span>
        {symbolElement}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {symbolElement}
      <span>{formattedNumber}</span>
    </span>
  )
}

export default AdminPrice
