'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Search, ChevronDown, Check, X } from 'lucide-react'

interface CurrencySelectorProps {
  currency?: string
  onCurrencyChange?: (currency: string) => void
  rate?: number
  onRateChange?: (rate: number) => void
  disabled?: boolean
  baseCurrency?: string
  availableCurrencies?: string[]
}

export function CurrencySelector({
  currency: initialCurrency = 'CNY',
  onCurrencyChange,
  rate: initialRate,
  onRateChange,
  disabled = false,
  baseCurrency = 'USD',
  availableCurrencies,
}: CurrencySelectorProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency)
  const [rate, setRate] = useState<number | null>(initialRate || null)
  const [isManualRate, setIsManualRate] = useState(false)
  const [manualRate, setManualRate] = useState<number | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync selected currency with prop changes
  useEffect(() => {
    if (initialCurrency) {
      setSelectedCurrency(initialCurrency)
    }
  }, [initialCurrency])

  // Sync rate with prop changes
  useEffect(() => {
    if (initialRate !== undefined && initialRate !== null && !isManualRate) {
      setRate(initialRate)
    }
  }, [initialRate, isManualRate])

  // Fetch currencies
  const { data: currencies, isLoading } = useQuery({
    queryKey: ['currencies', 'active'],
    queryFn: () => api.get('/api/currencies?active=true'),
    staleTime: 5 * 60 * 1000,
  })

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setSearchQuery('')
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isDropdownOpen])

  // Fetch exchange rate when currency changes
  const { data: rateData, refetch: refetchRate } = useQuery({
    queryKey: ['exchange-rate', selectedCurrency, baseCurrency],
    queryFn: async () => {
      const res = await api.get(`/api/currency/rate?from=${selectedCurrency}&to=${baseCurrency}`)
      return res
    },
    enabled: !!selectedCurrency && selectedCurrency !== baseCurrency,
    staleTime: 60 * 60 * 1000, // 1 hour
  })

  // Update rate when fetched
  useEffect(() => {
    if (rateData?.rate && !isManualRate) {
      setRate(rateData.rate)
      if (onRateChange) onRateChange(rateData.rate)
    }
  }, [rateData, isManualRate, onRateChange])

  // If same currency as base, rate is 1
  useEffect(() => {
    if (selectedCurrency === baseCurrency) {
      setRate(1)
      if (onRateChange) onRateChange(1)
    }
  }, [selectedCurrency, baseCurrency, onRateChange])

  // Handle currency change
  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency)
    setIsDropdownOpen(false)
    setSearchQuery('')
    if (onCurrencyChange) onCurrencyChange(currency)
    // Reset manual rate when currency changes
    setIsManualRate(false)
    setManualRate(null)
    // Refetch rate for new currency
    if (currency !== baseCurrency) {
      refetchRate()
    }
  }

  // Handle manual rate toggle
  const handleManualRateToggle = (checked: boolean) => {
    setIsManualRate(checked)
    if (!checked) {
      // Use system rate
      setRate(rateData?.rate || 1)
      if (onRateChange) onRateChange(rateData?.rate || 1)
    } else {
      // Use manual rate (fallback to current rate)
      setManualRate(rateData?.rate || 1)
      if (onRateChange) onRateChange(rateData?.rate || 1)
    }
  }

  // Handle manual rate change
  const handleManualRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0
    setManualRate(val)
    setRate(val)
    if (onRateChange) onRateChange(val)
  }

  const displayRate = isManualRate ? manualRate || rate : rate

  // Filter active currencies
  const activeCurrencies = useMemo(() => {
    const list = availableCurrencies
      ? currencies?.data?.filter((c: any) => availableCurrencies.includes(c.code))
      : currencies?.data?.filter((c: any) => c.isActive)
    return list || []
  }, [currencies, availableCurrencies])

  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return activeCurrencies
    return activeCurrencies.filter((c: any) => {
      const codeMatch = c.code?.toLowerCase().includes(q)
      const nameMatch = c.name?.toLowerCase().includes(q)
      const symbolMatch = c.symbol?.toLowerCase().includes(q)
      return codeMatch || nameMatch || symbolMatch
    })
  }, [activeCurrencies, searchQuery])

  const selectedCurrencyData = activeCurrencies.find((c: any) => c.code === selectedCurrency)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse h-10 w-full bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className={`grid ${selectedCurrency !== baseCurrency ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'} gap-4 items-start`}>
        {/* Searchable Currency Dropdown */}
        <div className={`relative space-y-2 ${selectedCurrency !== baseCurrency ? 'lg:col-span-5' : 'w-full'}`} ref={dropdownRef}>
          <Label className="block text-sm font-medium">Currency</Label>

          {/* Trigger */}
          <div
            onClick={() => !disabled && setIsDropdownOpen((prev) => !prev)}
            className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white transition select-none ${
              disabled
                ? 'cursor-not-allowed bg-gray-50 opacity-60'
                : 'cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]'
            } ${isDropdownOpen ? 'border-[#1a3a5c] ring-2 ring-[#1a3a5c]' : ''}`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-gray-900">
                {selectedCurrencyData?.symbol || ''} {selectedCurrency}
              </span>
              {selectedCurrencyData?.name && (
                <span className="text-xs text-gray-400 truncate hidden sm:inline">
                  - {selectedCurrencyData.name}
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </div>

          {/* Searchable Menu */}
          {isDropdownOpen && !disabled && (
            <div className="absolute z-50 mt-1 w-full min-w-[260px] rounded-md border border-gray-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95">
              {/* Search Box */}
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search code, name, symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-gray-50 border-gray-200 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-60 overflow-y-auto p-1 divide-y divide-gray-50">
                {filteredCurrencies.length === 0 ? (
                  <div className="py-4 text-center text-xs text-gray-500">
                    No currencies found
                  </div>
                ) : (
                  filteredCurrencies.map((currency: any) => {
                    const isSelected = currency.code === selectedCurrency
                    return (
                      <div
                        key={currency.code}
                        onClick={() => handleCurrencyChange(currency.code)}
                        className={`flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-50/80 text-indigo-950 font-medium'
                            : 'hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-6 text-center font-bold text-gray-700 shrink-0">
                            {currency.symbol || '-'}
                          </span>
                          <span className="font-semibold text-gray-900">{currency.code}</span>
                          {currency.name && (
                            <span className="text-xs text-gray-400 truncate">
                              ({currency.name})
                            </span>
                          )}
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Exchange Rate Section - Takes remaining space */}
        {selectedCurrency !== baseCurrency && (
          <div className="space-y-2 lg:col-span-7">
            {/* Label with Manual Checkbox */}
            <div className="flex items-center justify-between">
              <Label className="block text-sm font-medium">Exchange Rate</Label>
              <label className="flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isManualRate}
                  onChange={(e) => handleManualRateToggle(e.target.checked)}
                  disabled={disabled}
                  className="w-3.5 h-3.5 text-[#1a3a5c] border-gray-300 rounded focus:ring-[#1a3a5c]"
                />
                <span className="text-xs text-gray-500 font-medium">Manual</span>
              </label>
            </div>

            {/* Rate Input Row */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center justify-center bg-gray-50 border border-gray-300 rounded-md px-2.5 sm:px-3 h-10 shrink-0">
                <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">1 {baseCurrency} =</span>
              </div>
              <Input
                type="number"
                step="0.000001"
                min="0.000001"
                value={isManualRate ? (manualRate || '') : (displayRate?.toFixed(6) || '')}
                onChange={handleManualRateChange}
                disabled={disabled || !isManualRate}
                className="h-10 text-xs sm:text-sm min-w-0 flex-1 bg-white"
                placeholder="1.000000"
              />
              <div className="flex items-center justify-center bg-gray-50 border border-gray-300 rounded-md px-2.5 sm:px-3 h-10 shrink-0">
                <span className="text-xs sm:text-sm text-gray-700 font-semibold">{selectedCurrency}</span>
              </div>
              {!isManualRate && (
                <button
                  type="button"
                  onClick={() => refetchRate()}
                  className="text-gray-400 hover:text-gray-600 transition p-2 rounded-md hover:bg-gray-100 shrink-0"
                  title="Refresh rate"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Info Text */}
            <div className="text-[11px] text-gray-400 leading-none">
              {isManualRate ? (
                <span>Custom manual rate</span>
              ) : (
                rateData?.updatedAt && (
                  <span>Updated: {new Date(rateData.updatedAt).toLocaleDateString()}</span>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

