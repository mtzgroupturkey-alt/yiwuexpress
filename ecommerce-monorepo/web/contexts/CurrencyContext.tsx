'use client'

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useSettings } from '@/components/SettingsProvider'

import { setCookie, getCookie } from '@/lib/locale-navigation'

export interface CurrencyItem {
  id?: string
  code: string
  name: string
  symbol: string
  symbolPosition: 'before' | 'after' | string
  decimalPlaces: number
  isBase: boolean
  isActive: boolean
  exchangeRate: number | null
  exchangeRateUpdatedAt?: string | null
}

const DEFAULT_CURRENCIES: CurrencyItem[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', symbolPosition: 'before', decimalPlaces: 2, isBase: true, isActive: true, exchangeRate: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', symbolPosition: 'before', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 0.92 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', symbolPosition: 'before', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 7.23 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', symbolPosition: 'after', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 92.50 },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'BYN', symbolPosition: 'after', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 3.27 },
  { code: 'GBP', name: 'British Pound', symbol: '£', symbolPosition: 'before', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 0.79 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', symbolPosition: 'before', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 3.67 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', symbolPosition: 'before', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 32.50 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', symbolPosition: 'before', decimalPlaces: 0, isBase: false, isActive: true, exchangeRate: 150.0 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', symbolPosition: 'before', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 3.75 },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', symbolPosition: 'after', decimalPlaces: 2, isBase: false, isActive: true, exchangeRate: 450.0 }
]

export interface CurrencyContextType {
  currency: string
  currencies: CurrencyItem[]
  currentCurrency: CurrencyItem
  baseCurrency: CurrencyItem
  setCurrency: (code: string) => void
  formatPrice: (amountInUSD: number, options?: { showSymbol?: boolean; decimalPlaces?: number }) => string
  convertPrice: (amountInUSD: number) => number
  rate: number
  isLoading: boolean
  refreshCurrencies: () => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

export function CurrencyProvider({ 
  children,
  initialCurrency,
}: { 
  children: React.ReactNode
  initialCurrency?: string
}) {
  const { settings } = useSettings()
  const [currencies, setCurrencies] = useState<CurrencyItem[]>(DEFAULT_CURRENCIES)
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(
    initialCurrency?.toUpperCase() || ''
  )
  const [isLoading, setIsLoading] = useState(true)

  // Fetch active currencies with live exchange rates from DB / API
  const fetchCurrencies = useCallback(async () => {
    try {
      const res = await fetch('/api/currencies?active=true')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCurrencies(json.data)
        }
      }
    } catch (err) {
      console.error('[CurrencyContext] Failed to fetch live currencies:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCurrencies()
  }, [fetchCurrencies])

  // Initialize selected currency from cookie, localStorage, initialCurrency or settings
  useEffect(() => {
    const cookieCurrency = getCookie('NEXT_CURRENCY')
    const saved = typeof window !== 'undefined' ? localStorage.getItem('user_currency') : null
    
    if (cookieCurrency) {
      setSelectedCurrencyCode(cookieCurrency.toUpperCase())
    } else if (saved) {
      setSelectedCurrencyCode(saved.toUpperCase())
      setCookie('NEXT_CURRENCY', saved.toUpperCase(), 365)
    } else if (initialCurrency) {
      setSelectedCurrencyCode(initialCurrency.toUpperCase())
    } else if (settings?.currency) {
      setSelectedCurrencyCode(settings.currency.toUpperCase())
    } else {
      setSelectedCurrencyCode('USD')
    }
  }, [initialCurrency, settings?.currency])

  const setCurrency = useCallback((code: string) => {
    const upper = code.toUpperCase()
    setSelectedCurrencyCode(upper)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user_currency', upper)
      } catch {}
      setCookie('NEXT_CURRENCY', upper, 365)
    }
  }, [])

  const currentCurrency = useMemo(() => {
    const found = currencies.find((c) => c.code.toUpperCase() === selectedCurrencyCode.toUpperCase())
    if (found) return found
    const base = currencies.find((c) => c.isBase)
    return base || DEFAULT_CURRENCIES[0]
  }, [currencies, selectedCurrencyCode])

  const baseCurrency = useMemo(() => {
    return currencies.find((c) => c.isBase) || DEFAULT_CURRENCIES[0]
  }, [currencies])

  const rate = useMemo(() => {
    if (currentCurrency.isBase) return 1.0
    return currentCurrency.exchangeRate && currentCurrency.exchangeRate > 0
      ? currentCurrency.exchangeRate
      : 1.0
  }, [currentCurrency])

  const convertPrice = useCallback(
    (amountInUSD: number): number => {
      if (typeof amountInUSD !== 'number' || isNaN(amountInUSD)) return 0
      return amountInUSD * rate
    },
    [rate]
  )

  const formatPrice = useCallback(
    (
      amountInUSD: number,
      options?: { showSymbol?: boolean; decimalPlaces?: number }
    ): string => {
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

      const symbol = currentCurrency.symbol || currentCurrency.code
      if (currentCurrency.symbolPosition === 'after') {
        return `${formattedNumber} ${symbol}`
      }
      return `${symbol}${formattedNumber}`
    },
    [rate, currentCurrency]
  )

  const value = useMemo(
    () => ({
      currency: currentCurrency.code,
      currencies,
      currentCurrency,
      baseCurrency,
      setCurrency,
      formatPrice,
      convertPrice,
      rate,
      isLoading,
      refreshCurrencies: fetchCurrencies,
    }),
    [
      currentCurrency,
      currencies,
      baseCurrency,
      setCurrency,
      formatPrice,
      convertPrice,
      rate,
      isLoading,
      fetchCurrencies,
    ]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    // Graceful fallback for components outside CurrencyProvider
    const fallbackCurr = DEFAULT_CURRENCIES[0]
    return {
      currency: 'USD',
      currencies: DEFAULT_CURRENCIES,
      currentCurrency: fallbackCurr,
      baseCurrency: fallbackCurr,
      setCurrency: () => {},
      formatPrice: (amount: number) => `$${(amount || 0).toFixed(2)}`,
      convertPrice: (amount: number) => amount || 0,
      rate: 1.0,
      isLoading: false,
      refreshCurrencies: async () => {},
    }
  }
  return context
}
