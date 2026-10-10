import React from 'react'
import { BynSymbol } from '@/components/icons/BynSymbol'

interface CurrencySymbolProps {
  code?: string
  symbol?: string
  className?: string
  size?: number | string
}

/**
 * CurrencySymbol component
 * Renders the official NBRB Belarusian Ruble symbol for BYN,
 * or standard text/symbol for other currencies.
 */
export function CurrencySymbol({
  code,
  symbol,
  className = 'inline-block',
  size,
}: CurrencySymbolProps) {
  const isByn = code?.toUpperCase() === 'BYN' || symbol === 'BYN'

  if (isByn) {
    return (
      <BynSymbol
        className={className || 'inline-block w-[0.95em] h-[0.95em] align-[-0.125em]'}
        size={size}
      />
    )
  }

  return <span className={className}>{symbol || code || ''}</span>
}

export default CurrencySymbol
