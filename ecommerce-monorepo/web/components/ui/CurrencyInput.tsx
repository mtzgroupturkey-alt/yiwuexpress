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

interface CurrencyInputProps {
  value?: number
  onChange?: (value: number, currency: string, rate: number) => void
  currency?: string
  onCurrencyChange?: (currency: string) => void
  rate?: number
  onRateChange?: (rate: number) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  showRate?: boolean
  showBaseConversion?: boolean
  baseCurrency?: string // Defaults to USD
  availableCurrencies?: string[] // If not provided, all active currencies
}

export function CurrencyInput({
  value = 0,
  onChange,
  currency: initialCurrency = 'USD',
  onCurrencyChange,
  rate: initialRate,
  onRateChange,
  label = 'Amount',
  placeholder = '0.00',
  disabled = false,
  showRate = true,
  showBaseConversion = true,
  baseCurrency = 'USD',
  availableCurrencies,
}: CurrencyInputProps) {
  const [amount, setAmount] = useState(value)
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency)
  const [rate, setRate] = useState<number | null>(initialRate || null)
  const [isManualRate, setIsManualRate] = useState(false)
  const [manualRate, setManualRate] = useState<number | null>(null)

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
    enabled: !!selectedCurrency && showRate && selectedCurrency !== baseCurrency,
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

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0
    setAmount(val)
    if (onChange) onChange(val, selectedCurrency, isManualRate ? manualRate || rate || 1 : rate || 1)
  }

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

  // Calculate base conversion
  const baseAmount = amount * finalRate

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
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          {selectedCurrencyData && (
            <Badge variant="outline" className="text-xs">
              {selectedCurrencyData.symbol} {selectedCurrencyData.code}
            </Badge>
          )}
        </div>
      )}

      {/* Main Input Group */}
      <div className="flex flex-wrap gap-2">
        {/* Amount Input */}
        <div className="flex-1 min-w-[150px]">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount || ''}
            onChange={handleAmountChange}
            placeholder={placeholder}
            disabled={disabled}
            className="h-10"
          />
        </div>

        {/* Currency Select */}
        <div className="w-32">
          <Select value={selectedCurrency} onValueChange={handleCurrencyChange} disabled={disabled}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Currency" />
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
      </div>

      {/* Rate Section */}
      {showRate && selectedCurrency !== baseCurrency && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Exchange Rate</span>
              <Badge variant="secondary" className="text-xs">
                1 {selectedCurrency} = {finalRate.toFixed(4)} {baseCurrency}
              </Badge>
              <button
                type="button"
                onClick={() => refetchRate()}
                className="text-gray-400 hover:text-gray-600 transition"
                title="Refresh rate"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Manual</span>
              <Switch
                checked={isManualRate}
                onCheckedChange={handleManualRateToggle}
                disabled={disabled}
                className="data-[state=checked]:bg-[#1a3a5c]"
              />
            </div>
          </div>

          {/* Rate Input */}
          {isManualRate ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">1 {selectedCurrency} =</span>
              <Input
                type="number"
                step="0.0001"
                min="0.0001"
                value={manualRate || ''}
                onChange={handleManualRateChange}
                disabled={disabled}
                className="w-32 h-8 text-sm"
              />
              <span className="text-sm text-gray-500">{baseCurrency}</span>
              <span className="text-xs text-gray-400 ml-2">(manual override)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                1 {selectedCurrency} = {displayRate?.toFixed(4) || '...'} {baseCurrency}
                {rateData?.updatedAt && (
                  <span className="text-xs text-gray-400 ml-2">
                    Updated: {new Date(rateData.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Base Currency Conversion */}
          {showBaseConversion && amount > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Base Currency Value</span>
                <span className="text-sm font-semibold text-[#1a3a5c]">
                  {baseAmount.toFixed(2)} {baseCurrency}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
