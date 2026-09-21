'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ChevronDown, Plus, Check, X } from 'lucide-react'

export interface CompactQuoteAttributeSelectorProps {
  productId: string
  productName: string
  selectedOptions?: Record<string, string> | null
  variantId?: string | null
  onUpdateOptions: (
    newOptions: Record<string, string>,
    matchedVariant?: { id: string; sku?: string; image?: string } | null
  ) => void
  className?: string
}

interface ProductOptionsData {
  optionKeys: string[]
  optionValuesMap: Record<string, string[]>
  variants: any[]
}

const productOptionsCache = new Map<string, ProductOptionsData>()

const DEFAULT_COLOR_HEX_MAP: Record<string, string> = {
  black: '#111827',
  white: '#ffffff',
  gold: '#d4af37',
  silver: '#9ca3af',
  gray: '#6b7280',
  grey: '#6b7280',
  blue: '#2563eb',
  red: '#dc2626',
  green: '#16a34a',
  rose: '#f43f5e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  brown: '#78350f',
  beige: '#f5f5dc',
  navy: '#1e3a8a',
  pink: '#ec4899',
}

function resolveColorHex(val: string): string {
  if (val.startsWith('#')) return val
  const key = val.toLowerCase().trim()
  return DEFAULT_COLOR_HEX_MAP[key] || '#94a3b8'
}

export function CompactQuoteAttributeSelector({
  productId,
  productName,
  selectedOptions,
  variantId,
  onUpdateOptions,
  className = '',
}: CompactQuoteAttributeSelectorProps) {
  const [productData, setProductData] = useState<ProductOptionsData | null>(() => {
    return productOptionsCache.get(productId) || null
  })
  const [customKey, setCustomKey] = useState<string | null>(null)
  const [customVal, setCustomVal] = useState('')
  const [showAddSpec, setShowAddSpec] = useState(false)
  const [newSpecKey, setNewSpecKey] = useState('')
  const [newSpecVal, setNewSpecVal] = useState('')

  // Parse selected options safely if passed as string
  const currentOptions = useMemo<Record<string, string>>(() => {
    if (!selectedOptions) return {}
    if (typeof selectedOptions === 'string') {
      try {
        return JSON.parse(selectedOptions)
      } catch {
        return {}
      }
    }
    return selectedOptions
  }, [selectedOptions])

  // Fetch product options from API if not in cache
  useEffect(() => {
    if (!productId) return
    if (productOptionsCache.has(productId)) {
      setProductData(productOptionsCache.get(productId)!)
      return
    }

    let isMounted = true
    fetch(`/api/products/${productId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isMounted || !json?.data) return
        const prod = json.data
        const variants: any[] = prod.variants || []

        const keys = new Set<string>()
        const valuesMap: Record<string, Set<string>> = {}

        // 1. Extract from product variants
        variants.forEach((v) => {
          if (v.attributes && typeof v.attributes === 'object') {
            Object.entries(v.attributes).forEach(([k, val]) => {
              if (val) {
                keys.add(k)
                if (!valuesMap[k]) valuesMap[k] = new Set<string>()
                valuesMap[k].add(String(val))
              }
            })
          }
        })

        // 2. Extract from category attributes
        if (prod.categoryAttributes && Array.isArray(prod.categoryAttributes)) {
          prod.categoryAttributes.forEach((ca: any) => {
            const key = ca.name || ca.slug
            if (ca.options && Array.isArray(ca.options) && ca.options.length > 0) {
              keys.add(key)
              if (!valuesMap[key]) valuesMap[key] = new Set<string>()
              ca.options.forEach((opt: any) => valuesMap[key].add(String(opt)))
            } else if (ca.colorOptions && Array.isArray(ca.colorOptions) && ca.colorOptions.length > 0) {
              keys.add(key)
              if (!valuesMap[key]) valuesMap[key] = new Set<string>()
              ca.colorOptions.forEach((co: any) => valuesMap[key].add(String(co.label || co.value)))
            }
          })
        }

        // 3. Extract from product attributes object
        if (prod.attributes && typeof prod.attributes === 'object') {
          Object.entries(prod.attributes).forEach(([k, val]) => {
            if (Array.isArray(val) && val.length > 1) {
              keys.add(k)
              if (!valuesMap[k]) valuesMap[k] = new Set<string>()
              val.forEach((v) => valuesMap[k].add(String(v)))
            }
          })
        }

        const finalValuesMap: Record<string, string[]> = {}
        Object.keys(valuesMap).forEach((k) => {
          finalValuesMap[k] = Array.from(valuesMap[k])
        })

        const data: ProductOptionsData = {
          optionKeys: Array.from(keys),
          optionValuesMap: finalValuesMap,
          variants,
        }

        productOptionsCache.set(productId, data)
        setProductData(data)
      })
      .catch(() => {
        // Fallback silently if offline or test
      })

    return () => {
      isMounted = false
    }
  }, [productId])

  // Merge known option keys with whatever is in currentOptions
  const allOptionKeys = useMemo(() => {
    const keys = new Set<string>()
    if (productData?.optionKeys) {
      productData.optionKeys.forEach((k) => keys.add(k))
    }
    Object.keys(currentOptions).forEach((k) => keys.add(k))
    return Array.from(keys)
  }, [productData, currentOptions])

  // Merge known option values with current selected values
  const allOptionValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    allOptionKeys.forEach((k) => {
      const known = productData?.optionValuesMap[k] || []
      const current = currentOptions[k]
      const merged = new Set<string>(known)
      if (current) merged.add(current)
      map[k] = Array.from(merged)
    })
    return map
  }, [allOptionKeys, productData, currentOptions])

  const handleOptionChange = (key: string, value: string) => {
    const nextOptions = { ...currentOptions, [key]: value }

    // Check if new options match a specific variant
    let matchedVariant: { id: string; sku?: string; image?: string } | null = null
    const variants = productData?.variants || []
    if (variants.length > 0) {
      const match = variants.find((v) => {
        if (!v.attributes) return false
        return Object.entries(nextOptions).every(([k, vVal]) => {
          const vAttrKey = Object.keys(v.attributes).find(
            (attrK) => attrK.toLowerCase() === k.toLowerCase()
          )
          if (!vAttrKey) return true
          return String(v.attributes[vAttrKey]).toLowerCase() === String(vVal).toLowerCase()
        })
      })
      if (match) {
        matchedVariant = {
          id: match.id,
          sku: match.sku,
          image: match.images && match.images.length > 0 ? match.images[0] : undefined,
        }
      }
    }

    onUpdateOptions(nextOptions, matchedVariant)
  }

  const handleRemoveOption = (keyToRemove: string) => {
    const nextOptions = { ...currentOptions }
    delete nextOptions[keyToRemove]
    onUpdateOptions(nextOptions, null)
  }

  // If no options exist yet and none in database, show a discreet "+ Spec" button
  if (allOptionKeys.length === 0 && !showAddSpec) {
    return (
      <div className={`flex items-center gap-1.5 mt-1 ${className}`}>
        <button
          type="button"
          onClick={() => setShowAddSpec(true)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-[10px] font-semibold text-slate-500 hover:text-[#00407a] dark:text-slate-400 dark:hover:text-blue-400 bg-transparent active:scale-95 transition-all touch-manipulation cursor-pointer"
          title="Specify attributes (color, size, model, or custom specs)"
        >
          <Plus className="w-2.5 h-2.5" />
          <span>Select Options</span>
        </button>
      </div>
    )
  }

  return (
    <div
      data-testid="compact-quote-attribute-selector"
      className={`flex flex-wrap items-center gap-1.5 mt-1 ${className}`}
    >
      {allOptionKeys.map((key) => {
        const isColor =
          key.toLowerCase().includes('color') || key.toLowerCase() === 'colour'
        const values = allOptionValuesMap[key] || []
        const currentVal = currentOptions[key] || values[0] || ''
        const isCustomField = !productData?.optionKeys?.includes(key)

        return (
          <div
            key={key}
            className="inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-lg px-2 py-0.5 text-[11px] shadow-2xs group hover:border-[#00407a]/40 dark:hover:border-blue-500/40 transition-colors"
          >
            <span className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
              {key}:
            </span>

            {isColor && currentVal && (
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/15 dark:border-white/20 shrink-0 inline-block"
                style={{ backgroundColor: resolveColorHex(currentVal) }}
              />
            )}

            <div className="relative inline-flex items-center">
              <select
                value={currentVal}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setCustomKey(key)
                    setCustomVal('')
                  } else {
                    handleOptionChange(key, e.target.value)
                  }
                }}
                aria-label={`Select ${key}`}
                className="appearance-none bg-transparent font-bold text-[#00407a] dark:text-blue-400 text-[11px] pr-3.5 focus:outline-none cursor-pointer"
              >
                {values.map((v) => (
                  <option
                    key={v}
                    value={v}
                    className="text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                  >
                    {v}
                  </option>
                ))}
                <option
                  value="__custom__"
                  className="text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                >
                  + Custom...
                </option>
              </select>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400 pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" />
            </div>

            {/* Remove button for custom options */}
            {isCustomField && (
              <button
                type="button"
                onClick={() => handleRemoveOption(key)}
                aria-label={`Remove ${key}`}
                className="text-slate-400 hover:text-rose-500 ml-0.5 active:scale-90 transition-transform touch-manipulation cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )
      })}

      {/* Inline prompt when "+ Custom..." is chosen on an attribute */}
      {customKey && (
        <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 rounded-lg px-2 py-0.5 text-[11px]">
          <span className="text-blue-800 dark:text-blue-300 font-semibold text-[10px]">
            {customKey}:
          </span>
          <input
            type="text"
            autoFocus
            placeholder="Custom value"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (customVal.trim()) {
                  handleOptionChange(customKey, customVal.trim())
                  setCustomKey(null)
                }
              } else if (e.key === 'Escape') {
                setCustomKey(null)
              }
            }}
            className="bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-600 rounded px-1.5 py-0.5 text-[11px] font-semibold w-24 text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (customVal.trim()) {
                handleOptionChange(customKey, customVal.trim())
              }
              setCustomKey(null)
            }}
            className="text-emerald-600 hover:text-emerald-700 p-0.5 cursor-pointer"
            title="Save custom value"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setCustomKey(null)}
            className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
            title="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Inline mini-form to add a custom spec/option */}
      {showAddSpec ? (
        <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-0.5 text-[11px]">
          <input
            type="text"
            autoFocus
            placeholder="Spec (e.g. Model)"
            value={newSpecKey}
            onChange={(e) => setNewSpecKey(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600 rounded px-1.5 py-0.5 text-[10px] w-20 text-slate-900 dark:text-white focus:outline-none"
          />
          <span className="text-slate-400">:</span>
          <input
            type="text"
            placeholder="Value (e.g. 220V)"
            value={newSpecVal}
            onChange={(e) => setNewSpecVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (newSpecKey.trim() && newSpecVal.trim()) {
                  handleOptionChange(newSpecKey.trim(), newSpecVal.trim())
                  setShowAddSpec(false)
                  setNewSpecKey('')
                  setNewSpecVal('')
                }
              } else if (e.key === 'Escape') {
                setShowAddSpec(false)
              }
            }}
            className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600 rounded px-1.5 py-0.5 text-[10px] w-20 text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (newSpecKey.trim() && newSpecVal.trim()) {
                handleOptionChange(newSpecKey.trim(), newSpecVal.trim())
              }
              setShowAddSpec(false)
              setNewSpecKey('')
              setNewSpecVal('')
            }}
            className="text-emerald-600 hover:text-emerald-700 p-0.5 cursor-pointer"
            title="Add spec"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setShowAddSpec(false)}
            className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
            title="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddSpec(true)}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-[10px] font-semibold text-slate-500 hover:text-[#00407a] dark:text-slate-400 dark:hover:text-blue-400 bg-transparent active:scale-95 transition-all touch-manipulation cursor-pointer"
          title="Add custom specification"
        >
          <Plus className="w-2.5 h-2.5" />
          <span>Spec</span>
        </button>
      )}
    </div>
  )
}
