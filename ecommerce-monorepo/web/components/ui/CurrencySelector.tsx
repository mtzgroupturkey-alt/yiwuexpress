'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'

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
  const finalRate = isManualRate ? manualRate || rate || 1 : rate || 1

  // Get active currencies
  const activeCurrencies = availableCurrencies
    ? currencies?.data?.filter((c: any) => availableCurrencies.includes(c.code))
    : currencies?.data?.filter((c: any) => c.isActive)

  const selectedCurrencyData = currencies?.data?.find((c: any) => c.code === selectedCurrency)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse h-10 w-full bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[300px_1fr] gap-4">
      {/* Currency Dropdown */}
      <div>
        <Label className="mb-2 block">Currency</Label>
        <Select value={selectedCurrency} onValueChange={handleCurrencyChange} disabled={disabled}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select Currency" />
          </SelectTrigger>
          <SelectContent>
            {activeCurrencies?.map((currency: any) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.symbol} {currency.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Exchange Rate Section - Takes remaining space */}
      {selectedCurrency !== baseCurrency && (
        <div>
          {/* Label with Manual Checkbox */}
          <div className="flex items-center justify-between mb-2">
            <Label>Exchange Rate</Label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isManualRate}
                onChange={(e) => handleManualRateToggle(e.target.checked)}
                disabled={disabled}
                className="w-3 h-3 text-[#1a3a5c] border-gray-300 rounded focus:ring-[#1a3a5c]"
              />
              <span className="text-xs text-gray-500">Manual</span>
            </label>
          </div>

          {/* Rate Input Row */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center bg-gray-50 border rounded px-3 py-2 h-10">
              <span className="text-sm text-gray-600 whitespace-nowrap">1 {baseCurrency} =</span>
            </div>
            <Input
              type="number"
              step="0.000001"
              min="0.000001"
              value={isManualRate ? (manualRate || '') : (displayRate?.toFixed(6) || '')}
              onChange={handleManualRateChange}
              disabled={disabled || !isManualRate}
              className="h-10 text-sm min-w-[200px] w-[250px]"
              placeholder="1.000000"
            />
            <div className="flex items-center justify-center bg-gray-50 border rounded px-3 py-2 h-10">
              <span className="text-sm text-gray-600">{selectedCurrency}</span>
            </div>
            {!isManualRate && (
              <button
                type="button"
                onClick={() => refetchRate()}
                className="text-gray-400 hover:text-gray-600 transition p-2"
                title="Refresh rate"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Info Text */}
          <div className="mt-1 text-xs text-gray-400">
            {isManualRate ? (
              <span>Custom rate</span>
            ) : (
              rateData?.updatedAt && (
                <span>Updated: {new Date(rateData.updatedAt).toLocaleDateString()}</span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
