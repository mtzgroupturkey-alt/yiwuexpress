'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { CurrencySymbol } from '@/components/ui/CurrencySymbol'

export interface AdminCurrencyItem {
  id?: string
  code: string
  name: string
  symbol: string
  symbolPosition: 'before' | 'after' | string
  decimalPlaces: number
  isBase: boolean
  isActive: boolean
  exchangeRate: number | null
}

export const DEFAULT_ADMIN_CURRENCIES: AdminCurrencyItem[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', symbolPosition: 'before', decimalPlaces: 2, isBase: true, isActive: true, exchangeRate: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', symbolPosition: 'before', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 0.92 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', symbolPosition: 'before', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 7.23 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', symbolPosition: 'after', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 92.50 },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'BYN', symbolPosition: 'after', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 3.27 },
  { code: 'GBP', name: 'British Pound', symbol: '£', symbolPosition: 'before', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 0.79 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', symbolPosition: 'before', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 3.67 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', symbolPosition: 'before', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 32.50 },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', symbolPosition: 'after', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 450.0 },
]

export interface AdminCurrencyContextType {
  currency: string
  currencies: AdminCurrencyItem[]
  currentCurrency: AdminCurrencyItem
  baseCurrency: AdminCurrencyItem
  rate: number
  isLoading: boolean
  setCurrency: (code: string) => void
  formatPrice: (amountInUSD: number, options?: { showSymbol?: boolean; decimalPlaces?: number }) => string
  renderPrice: (amountInUSD: number, options?: { showSymbol?: boolean; decimalPlaces?: number; className?: string; symbolClassName?: string }) => React.ReactNode
  convertFromUSD: (amountInUSD: number) => number
  convertToUSD: (amountInCurrentCurrency: number) => number
  refreshCurrencies: () => Promise<void>
}

const AdminCurrencyContext = createContext<AdminCurrencyContextType | null>(null)

export function AdminCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencies, setCurrencies] = useState<AdminCurrencyItem[]>(DEFAULT_ADMIN_CURRENCIES)
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('USD')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // 1. Initialize selected currency from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('admin_currency')
        if (saved) {
          setSelectedCurrencyCode(saved.toUpperCase())
        }
      }
    } catch (e) {
      console.warn('Failed to read admin_currency from localStorage:', e)
    }
  }, [])

  // 2. Fetch live currencies from API
  const refreshCurrencies = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/currencies?active=true')
      const json = await res.json()
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setCurrencies(json.data)
      }
    } catch (err) {
      console.warn('Failed to fetch admin currencies from API, keeping fallbacks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCurrencies()
  }, [refreshCurrencies])

  // 3. Setter persisting to localStorage
  const setCurrency = useCallback((code: string) => {
    const upper = (code || 'USD').toUpperCase()
    setSelectedCurrencyCode(upper)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_currency', upper)
      }
    } catch (e) {
      console.warn('Failed to save admin_currency to localStorage:', e)
    }
  }, [])

  // 4. Resolve active and base currencies
  const baseCurrency = useMemo<AdminCurrencyItem>(() => {
    return currencies.find((c) => c.isBase) || currencies.find((c) => c.code === 'USD') || DEFAULT_ADMIN_CURRENCIES[0]
  }, [currencies])

  const currentCurrency = useMemo<AdminCurrencyItem>(() => {
    const found = currencies.find((c) => c.code.toUpperCase() === selectedCurrencyCode.toUpperCase())
    if (found) return found
    const def = DEFAULT_ADMIN_CURRENCIES.find((c) => c.code.toUpperCase() === selectedCurrencyCode.toUpperCase())
    return def || baseCurrency
  }, [currencies, selectedCurrencyCode, baseCurrency])

  const rate = useMemo(() => {
    if (currentCurrency.code === baseCurrency.code) return 1.0
    return currentCurrency.exchangeRate && currentCurrency.exchangeRate > 0
      ? currentCurrency.exchangeRate
      : 1.0
  }, [currentCurrency, baseCurrency])

  // 5. Converters: base USD <-> active admin currency
  const convertFromUSD = useCallback(
    (amountInUSD: number): number => {
      if (typeof amountInUSD !== 'number' || isNaN(amountInUSD)) return 0
      return Math.round((amountInUSD * rate + Number.EPSILON) * 100) / 100
    },
    [rate]
  )

  const convertToUSD = useCallback(
    (amountInCurrentCurrency: number): number => {
      if (typeof amountInCurrentCurrency !== 'number' || isNaN(amountInCurrentCurrency)) return 0
      if (rate <= 0) return amountInCurrentCurrency
      return Math.round((amountInCurrentCurrency / rate + Number.EPSILON) * 10000) / 10000
    },
    [rate]
  )

  // 6. Formatter for text
  const formatPrice = useCallback(
    (amountInUSD: number, options?: { showSymbol?: boolean; decimalPlaces?: number }): string => {
      if (typeof amountInUSD !== 'number' || isNaN(amountInUSD)) return '0.00'
      const converted = amountInUSD * rate
      const decimals = options?.decimalPlaces ?? currentCurrency.decimalPlaces ?? 2
      const formattedNumber = converted.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })

      if (options?.showSymbol === false) {
        return formattedNumber
      }

      let symbol = currentCurrency.symbol || currentCurrency.code
      if (currentCurrency.code === 'BYN') {
        symbol = 'BYN'
      }

      if (currentCurrency.symbolPosition === 'after') {
        return `${formattedNumber} ${symbol}`
      }
      return `${symbol}${formattedNumber}`
    },
    [rate, currentCurrency]
  )

  // 7. Formatter with official JSX SVG symbol for BYN & icons
  const renderPrice = useCallback(
    (
      amountInUSD: number,
      options?: { showSymbol?: boolean; decimalPlaces?: number; className?: string; symbolClassName?: string }
    ): React.ReactNode => {
      if (typeof amountInUSD !== 'number' || isNaN(amountInUSD)) {
        return <span className={options?.className}>0.00</span>
      }

      const converted = amountInUSD * rate
      const decimals = options?.decimalPlaces ?? currentCurrency.decimalPlaces ?? 2
      const formattedNumber = converted.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })

      if (options?.showSymbol === false) {
        return <span className={options?.className}>{formattedNumber}</span>
      }

      const isByn = currentCurrency.code === 'BYN'
      const symbolElement = (
        <CurrencySymbol
          code={currentCurrency.code}
          symbol={isByn ? undefined : (currentCurrency.symbol || currentCurrency.code)}
          className={options?.symbolClassName}
        />
      )

      if (currentCurrency.symbolPosition === 'after') {
        return (
          <span className={`inline-flex items-center gap-1 ${options?.className || ''}`}>
            <span>{formattedNumber}</span>
            {symbolElement}
          </span>
        )
      }

      return (
        <span className={`inline-flex items-center gap-0.5 ${options?.className || ''}`}>
          {symbolElement}
          <span>{formattedNumber}</span>
        </span>
      )
    },
    [rate, currentCurrency]
  )

  const contextValue = useMemo<AdminCurrencyContextType>(
    () => ({
      currency: currentCurrency.code,
      currencies,
      currentCurrency,
      baseCurrency,
      rate,
      isLoading,
      setCurrency,
      formatPrice,
      renderPrice,
      convertFromUSD,
      convertToUSD,
      refreshCurrencies,
    }),
    [
      currentCurrency,
      currencies,
      baseCurrency,
      rate,
      isLoading,
      setCurrency,
      formatPrice,
      renderPrice,
      convertFromUSD,
      convertToUSD,
      refreshCurrencies,
    ]
  )

  return (
    <AdminCurrencyContext.Provider value={contextValue}>
      {children}
    </AdminCurrencyContext.Provider>
  )
}

export function useAdminCurrency(): AdminCurrencyContextType {
  const ctx = useContext(AdminCurrencyContext)
  if (!ctx) {
    const base = DEFAULT_ADMIN_CURRENCIES[0]
    return {
      currency: 'USD',
      currencies: DEFAULT_ADMIN_CURRENCIES,
      currentCurrency: base,
      baseCurrency: base,
      rate: 1.0,
      isLoading: false,
      setCurrency: () => {},
      formatPrice: (amount: number) => `$${Number(amount || 0).toFixed(2)}`,
      renderPrice: (amount: number) => `$${Number(amount || 0).toFixed(2)}`,
      convertFromUSD: (amount: number) => amount,
      convertToUSD: (amount: number) => amount,
      refreshCurrencies: async () => {},
    }
  }
  return ctx
}

export { AdminPrice } from '@/components/admin/AdminPrice'

