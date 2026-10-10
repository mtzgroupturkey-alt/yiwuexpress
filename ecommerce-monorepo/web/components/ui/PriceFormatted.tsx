'use client'

import React from 'react'
import { useCurrency } from '@/hooks/useCurrency'
import { CurrencySymbol } from './CurrencySymbol'

interface PriceFormattedProps {
  amount: number
  className?: string
  symbolClassName?: string
  options?: {
    showSymbol?: boolean
    decimalPlaces?: number
  }
}

/**
 * PriceFormatted component
 * Formats numeric price according to the active currency, rendering the
 * official BYN symbol SVG when the active currency is BYN.
 */
export function PriceFormatted({
  amount,
  className = '',
  symbolClassName,
  options,
}: PriceFormattedProps) {
  const { currentCurrency, rate } = useCurrency()

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

export default PriceFormatted
