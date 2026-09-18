'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  COUNTRIES,
  COUNTRY_CITIES,
  getCitiesForCountry,
  getCountryFlag,
  parseLocationString,
  formatLocationString,
} from '@/lib/countries'
import {
  Search,
  ChevronDown,
  Check,
  X,
  MapPin,
  Anchor,
  Building2,
  Edit2,
  ListFilter,
  Globe2,
} from 'lucide-react'

// Frequently used trade/logistics countries for quick 1-click pills
const FREQUENT_COUNTRIES = [
  { code: 'CN', name: 'China' },
  { code: 'BY', name: 'Belarus' },
  { code: 'RU', name: 'Russia' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'AE', name: 'UAE' },
  { code: 'PL', name: 'Poland' },
  { code: 'DE', name: 'Germany' },
  { code: 'US', name: 'USA' },
]

interface CountryCityPickerProps {
  label: string
  value: string
  onChange: (value: string, details?: { country: string; city: string; countryCode: string }) => void
  defaultCountry?: string
  defaultCity?: string
  required?: boolean
  disabled?: boolean
  compact?: boolean
  countryPlaceholder?: string
  cityPlaceholder?: string
  helperText?: string
  idPrefix?: string
}

export function CountryCityPicker({
  label,
  value,
  onChange,
  defaultCountry = '',
  defaultCity = '',
  required = false,
  disabled = false,
  compact = false,
  countryPlaceholder = 'Search & select country...',
  cityPlaceholder = 'Select city or maritime port...',
  helperText,
  idPrefix = 'loc',
}: CountryCityPickerProps) {
  // Parse incoming value into country and city
  const initialParsed = useMemo(() => {
    if (value) {
      return parseLocationString(value)
    }
    return {
      country: defaultCountry,
      city: defaultCity,
      countryCode: '',
    }
  }, [value, defaultCountry, defaultCity])

  const [selectedCountry, setSelectedCountry] = useState<string>(initialParsed.country)
  const [selectedCity, setSelectedCity] = useState<string>(initialParsed.city)
  const [isCustomCity, setIsCustomCity] = useState<boolean>(false)
  const [customCityValue, setCustomCityValue] = useState<string>('')

  // Dropdown open states
  const [isCountryOpen, setIsCountryOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [isCityOpen, setIsCityOpen] = useState(false)

  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const cityDropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync internal state when external value prop updates
  useEffect(() => {
    const parsed = parseLocationString(value)
    setSelectedCountry(parsed.country)

    if (parsed.country) {
      const cities = getCitiesForCountry(parsed.country)
      if (parsed.city && cities.length > 0 && !cities.includes(parsed.city)) {
        setIsCustomCity(true)
        setCustomCityValue(parsed.city)
      } else {
        setIsCustomCity(false)
        setSelectedCity(parsed.city)
      }
    } else {
      setSelectedCity(parsed.city)
    }
  }, [value])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false)
        setCountrySearch('')
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityOpen(false)
      }
    }

    if (isCountryOpen || isCityOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCountryOpen, isCityOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isCountryOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isCountryOpen])

  // Available cities for the selected country
  const availableCities = useMemo(() => {
    return getCitiesForCountry(selectedCountry)
  }, [selectedCountry])

  // Selected country object
  const currentCountryObj = useMemo(() => {
    return COUNTRIES.find(
      (c) =>
        c.name.toLowerCase() === selectedCountry.toLowerCase() ||
        c.code.toLowerCase() === selectedCountry.toLowerCase()
    )
  }, [selectedCountry])

  // Filter countries by search query
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES
    const q = countrySearch.toLowerCase().trim()
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [countrySearch])

  // Handle selecting a country
  const handleSelectCountry = (countryName: string, countryCode: string) => {
    setSelectedCountry(countryName)
    setIsCountryOpen(false)
    setCountrySearch('')

    const newCities = getCitiesForCountry(countryName)
    let nextCity = ''
    if (newCities.length > 0) {
      if (newCities.includes(selectedCity)) {
        nextCity = selectedCity
      } else {
        nextCity = newCities[0]
      }
    }

    setSelectedCity(nextCity)
    setIsCustomCity(false)
    setCustomCityValue('')

    const formatted = formatLocationString(countryName, nextCity)
    onChange(formatted, { country: countryName, city: nextCity, countryCode })
  }

  // Handle selecting a city
  const handleSelectCity = (city: string) => {
    if (city === '__CUSTOM__') {
      setIsCustomCity(true)
      setIsCityOpen(false)
      setCustomCityValue(selectedCity || '')
      return
    }

    setSelectedCity(city)
    setIsCustomCity(false)
    setIsCityOpen(false)

    const formatted = formatLocationString(selectedCountry, city)
    const code = currentCountryObj?.code || ''
    onChange(formatted, { country: selectedCountry, city, countryCode: code })
  }

  // Handle custom city typing
  const handleCustomCityChange = (customCity: string) => {
    setCustomCityValue(customCity)
    const formatted = formatLocationString(selectedCountry, customCity)
    const code = currentCountryObj?.code || ''
    onChange(formatted, { country: selectedCountry, city: customCity, countryCode: code })
  }

  // Clear selection
  const handleClear = () => {
    setSelectedCountry('')
    setSelectedCity('')
    setIsCustomCity(false)
    setCustomCityValue('')
    onChange('', { country: '', city: '', countryCode: '' })
  }

  return (
    <div className={`space-y-1.5 relative ${isCountryOpen || isCityOpen ? 'z-40' : 'z-10'}`}>
      {/* Label and formatted location summary */}
      <div className="flex items-center justify-between">
        <Label className={`flex items-center gap-1.5 font-medium ${compact ? 'text-xs' : 'text-sm text-slate-900 dark:text-slate-100'}`}>
          <MapPin className={`text-blue-600 ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </Label>
        {value && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Selected:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm">
              <span className="text-sm leading-none">{currentCountryObj && getCountryFlag(currentCountryObj.code)}</span>
              {value}
            </span>
          </div>
        )}
      </div>

      {/* Inputs Grid: Country + City/Port */}
      <div className={`grid ${compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 sm:grid-cols-2 gap-3'}`}>
        
        {/* ========================================================= */}
        {/* 1. SEARCHABLE COUNTRY SELECTOR */}
        {/* ========================================================= */}
        <div className={`relative ${isCountryOpen ? 'z-50' : 'z-20'}`} ref={countryDropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsCountryOpen(!isCountryOpen)
              setIsCityOpen(false)
            }}
            className={`w-full flex items-center justify-between rounded-lg border bg-white dark:bg-slate-900 text-left transition-all shadow-sm ${
              compact ? 'h-9 px-2.5 text-xs' : 'h-11 px-3.5 text-sm'
            } ${
              isCountryOpen
                ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
              !selectedCountry && required ? 'border-amber-400 bg-amber-50/20' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              {currentCountryObj ? (
                <>
                  <span className="inline-flex items-center justify-center font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 min-w-[28px] shrink-0">
                    {currentCountryObj.code}
                  </span>
                  <span className="text-base leading-none shrink-0">{getCountryFlag(currentCountryObj.code)}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {currentCountryObj.name}
                  </span>
                </>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-2 truncate">
                  <Globe2 className="w-4 h-4 text-slate-400" />
                  {countryPlaceholder}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCountryOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </div>
          </button>

          {/* OPAQUE COUNTRY DROPDOWN MENU */}
          {isCountryOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-full min-w-[320px] max-w-[480px] rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl z-[100] overflow-hidden animate-in fade-in-0 zoom-in-95">
              
              {/* Sticky Search Box */}
              <div className="p-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    ref={searchInputRef}
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Type to search country (e.g. China, BY, Russia)..."
                    className="h-9 pl-9 pr-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg shadow-inner focus:ring-2 focus:ring-blue-500"
                  />
                  {countrySearch && (
                    <button
                      type="button"
                      onClick={() => setCountrySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick 1-Click Common Logistics Hubs */}
                {!countrySearch && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Top Shipping Corridors
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {FREQUENT_COUNTRIES.map((item) => {
                        const isSelected = selectedCountry.toLowerCase() === item.name.toLowerCase()
                        return (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => handleSelectCountry(item.name, item.code)}
                            className={`text-xs px-2 py-1 rounded-md font-medium border transition-all flex items-center gap-1.5 shadow-sm ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-600'
                                : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <span className="text-sm leading-none">{getCountryFlag(item.code)}</span>
                            <span>{item.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable List of All Countries */}
              <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                {filteredCountries.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No matching countries found for &ldquo;{countrySearch}&rdquo;
                  </div>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = selectedCountry.toLowerCase() === c.name.toLowerCase()
                    const cityCount = COUNTRY_CITIES[c.code]?.length || 0
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectCountry(c.name, c.code)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-semibold border-l-4 border-blue-600'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="inline-flex items-center justify-center font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 min-w-[30px] shrink-0 border border-slate-200 dark:border-slate-700">
                            {c.code}
                          </span>
                          <span className="text-base leading-none shrink-0">{getCountryFlag(c.code)}</span>
                          <span className="text-sm font-medium truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {cityCount > 0 && (
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {cityCount} ports
                            </span>
                          )}
                          {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Bottom status & clear button */}
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{filteredCountries.length} countries available</span>
                {selectedCountry && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-red-600 dark:text-red-400 font-semibold hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 2. CITY / PORT SELECTOR */}
        {/* ========================================================= */}
        <div className={`relative ${isCityOpen ? 'z-50' : 'z-20'}`} ref={cityDropdownRef}>
          {isCustomCity || availableCities.length === 0 ? (
            /* Custom City Text Input */
            <div className="relative flex items-center">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Building2 className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              </div>
              <Input
                id={`${idPrefix}-custom-city`}
                value={isCustomCity ? customCityValue : selectedCity}
                onChange={(e) => {
                  if (isCustomCity) {
                    handleCustomCityChange(e.target.value)
                  } else {
                    setSelectedCity(e.target.value)
                    const formatted = formatLocationString(selectedCountry, e.target.value)
                    onChange(formatted, {
                      country: selectedCountry,
                      city: e.target.value,
                      countryCode: currentCountryObj?.code || '',
                    })
                  }
                }}
                disabled={disabled || !selectedCountry}
                placeholder={
                  selectedCountry
                    ? `Enter city or port in ${selectedCountry}...`
                    : 'Select country first...'
                }
                className={`w-full pl-9 ${availableCities.length > 0 ? 'pr-24' : 'pr-3'} rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 ${
                  compact ? 'h-9 text-xs' : 'h-11 text-sm'
                }`}
              />
              {availableCities.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCustomCity(false)
                    if (availableCities.length > 0) {
                      setSelectedCity(availableCities[0])
                      const formatted = formatLocationString(selectedCountry, availableCities[0])
                      onChange(formatted, {
                        country: selectedCountry,
                        city: availableCities[0],
                        countryCode: currentCountryObj?.code || '',
                      })
                    }
                  }}
                  className="absolute right-1.5 h-7 px-2.5 text-xs text-blue-600 border-blue-200 bg-blue-50/80 hover:bg-blue-100"
                >
                  <ListFilter className="w-3 h-3 mr-1" />
                  Ports List
                </Button>
              )}
            </div>
          ) : (
            /* Predefined City Dropdown */
            <>
              <button
                type="button"
                disabled={disabled || !selectedCountry}
                onClick={() => {
                  setIsCityOpen(!isCityOpen)
                  setIsCountryOpen(false)
                }}
                className={`w-full flex items-center justify-between rounded-lg border bg-white dark:bg-slate-900 text-left transition-all shadow-sm ${
                  compact ? 'h-9 px-2.5 text-xs' : 'h-11 px-3.5 text-sm'
                } ${
                  isCityOpen
                    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                } ${disabled || !selectedCountry ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {selectedCity ? (
                    <>
                      <Anchor className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{selectedCity}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 truncate flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-slate-400" />
                      {cityPlaceholder}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Badge variant="secondary" className="text-[10px] font-semibold py-0.5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hidden sm:inline-flex">
                    {availableCities.length} ports
                  </Badge>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCityOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </div>
              </button>

              {/* OPAQUE CITY DROPDOWN MENU */}
              {isCityOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl z-[100] overflow-hidden animate-in fade-in-0 zoom-in-95">
                  <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Maritime Ports & Trade Hubs
                    </span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{selectedCountry}</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                    {/* Entire country option */}
                    <button
                      type="button"
                      onClick={() => handleSelectCity('')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                        !selectedCity
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-semibold border-l-4 border-blue-600'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe2 className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-sm font-medium">Entire Country (All Ports / General)</span>
                      </div>
                      {!selectedCity && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

                    {/* Predefined list of cities */}
                    {availableCities.map((city) => {
                      const isSelected = selectedCity.toLowerCase() === city.toLowerCase()
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleSelectCity(city)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-semibold border-l-4 border-blue-600'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Anchor className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="text-sm font-medium truncate">{city}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </button>
                      )
                    })}

                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

                    {/* Custom City fallback option */}
                    <button
                      type="button"
                      onClick={() => handleSelectCity('__CUSTOM__')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Other / Enter Custom City or Terminal...</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {helperText && <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  )
}
