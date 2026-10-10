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
    const finalClass = [
      'inline-block align-[-0.08em]',
      className && className !== 'inline-block' ? className : 'w-[0.78em] h-[0.78em]',
    ].filter(Boolean).join(' ')

    return (
      <BynSymbol
        className={finalClass}
        size={size}
      />
    )
  }

  return <span className={className}>{symbol || code || ''}</span>
}

export default CurrencySymbol
