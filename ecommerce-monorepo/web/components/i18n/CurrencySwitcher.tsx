'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useCurrency, type CurrencyItem } from '@/hooks/useCurrency'
import { ChevronDown, Check, Coins, DollarSign } from 'lucide-react'

interface CurrencySwitcherProps {
  variant?: 'header-dropdown' | 'footer-dropdown' | 'drawer-radio' | 'simple'
  className?: string
  onSelect?: (currencyCode: string) => void
}

// Ensure key global trading currencies are always prioritized
const POPULAR_CURRENCIES = ['USD', 'RUB', 'CNY', 'EUR', 'GBP', 'AED', 'TRY', 'BYN', 'KZT']

export function CurrencySwitcher({
  variant = 'header-dropdown',
  className = '',
  onSelect,
}: CurrencySwitcherProps) {
  const { currency, setCurrency, currencies, currentCurrency } = useCurrency()
  const displayCode = typeof currency === 'string' ? currency : (currency as any)?.code || 'USD'
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleChoose = (code: string) => {
    setCurrency(code)
    setIsOpen(false)
    if (onSelect) {
      onSelect(code)
    }
  }

  // Filter active currencies and sort popular ones first
  const displayCurrencies = React.useMemo(() => {
    const list = currencies && currencies.length > 0 ? currencies.filter((c) => c.isActive !== false) : []
    return [...list].sort((a, b) => {
      const idxA = POPULAR_CURRENCIES.indexOf(a.code)
      const idxB = POPULAR_CURRENCIES.indexOf(b.code)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.code.localeCompare(b.code)
    })
  }, [currencies])

  // 1. Mobile Drawer Radio List Variant (R2)
  if (variant === 'drawer-radio') {
    // Show the primary currencies in radio format as specified in R2
    const drawerCurrencies = displayCurrencies.slice(0, 6)

    return (
      <div className={`space-y-1.5 ${className}`} data-testid="currency-switcher-drawer">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 px-1">
          <Coins className="w-4 h-4 text-[#00407a] dark:text-sky-400" />
          <span>Currency</span>
        </div>
        <div className="space-y-1">
          {drawerCurrencies.map((c) => {
            const isSelected = displayCode === c.code
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => handleChoose(c.code)}
                aria-label={`${c.symbol} ${c.code}`}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all touch-manipulation text-left cursor-pointer active:scale-98 ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-sky-950/40 text-[#00407a] dark:text-sky-300 font-bold border border-blue-200 dark:border-sky-800/60'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Radio Indicator (● vs ○) */}
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-[#00407a] dark:border-sky-400'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-[#00407a] dark:bg-sky-400" />
                    )}
                  </div>
                  <span className="font-bold">{c.code}</span>
                  <span className="text-gray-400 dark:text-slate-400">({c.symbol})</span>
                </div>
                <span className="text-[11px] text-gray-400 dark:text-slate-500 truncate max-w-[110px]">
                  {c.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 2. Desktop Footer Dropdown Variant (R4)
  if (variant === 'footer-dropdown') {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Select Currency"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 border border-slate-700/80 hover:border-slate-600 transition-colors cursor-pointer"
        >
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold">{currentCurrency?.symbol || '$'}</span>
          <span className="uppercase font-bold tracking-wider">{displayCode}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-52 max-h-72 overflow-y-auto bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
              Select Currency
            </div>
            {displayCurrencies.map((c) => {
              const isSelected = currency === c.code
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleChoose(c.code)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 text-sky-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-center font-bold text-slate-400">{c.symbol}</span>
                    <span>{c.code}</span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[90px]">({c.name})</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 stroke-[2.5]" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // 3. Desktop Header Dropdown Variant (R1 - Default)
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select Currency"
        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/90 hover:border-slate-300 dark:border-slate-700 transition-colors font-semibold text-slate-700 dark:text-slate-200 text-xs shadow-2xs group"
      >
        <span className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
          {currentCurrency?.symbol || '$'}
        </span>
        <span className="font-extrabold text-[#00407a] dark:text-blue-300 tracking-tight">
          {displayCode}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          role="listbox"
          className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-56 max-h-80 overflow-y-auto bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
        >
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Select Currency
          </div>
          {displayCurrencies.map((c) => {
            const isSelected = displayCode === c.code
            return (
              <button
                key={c.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleChoose(c.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#00407a] dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-5 text-center font-bold text-slate-500">{c.symbol}</span>
                  <span className="font-bold">{c.code}</span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[100px]">({c.name})</span>
                </span>
                {isSelected && <Check className="w-4 h-4 text-[#00407a] stroke-[2.5]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
