'use client'

import React from 'react'
import { Check } from 'lucide-react'

export interface ConfigurableAttributeOption {
  value: string
  label: string
  hex?: string
}

export interface ConfigurableAttribute {
  slug: string
  name: string
  type?: string
  isColor?: boolean
  options: ConfigurableAttributeOption[]
}

export interface MobileAttributeSelectorProps {
  optionKeys?: string[]
  optionValuesMap?: Record<string, string[]>
  configurableAttributes?: ConfigurableAttribute[]
  selectedOptions: Record<string, string>
  onSelectOption: (key: string, value: string) => void
  variants?: any[]
  className?: string
}

const DEFAULT_COLOR_HEX_MAP: Record<string, string> = {
  black: '#111827',
  white: '#f9fafb',
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

function resolveColorHex(val: string, customHex?: string): string {
  if (customHex && customHex.startsWith('#')) return customHex
  if (val.startsWith('#')) return val
  const key = val.toLowerCase().trim()
  return DEFAULT_COLOR_HEX_MAP[key] || '#94a3b8'
}

export function MobileAttributeSelector({
  optionKeys = [],
  optionValuesMap = {},
  configurableAttributes = [],
  selectedOptions = {},
  onSelectOption,
  variants = [],
  className = '',
}: MobileAttributeSelectorProps) {
  // 1. If variant-based options exist (from variants array)
  if (optionKeys.length > 0) {
    return (
      <div
        data-testid="mobile-attribute-selector"
        className={`bg-white dark:bg-[#0f172a] rounded-2xl p-3.5 border border-gray-200/80 dark:border-slate-800 space-y-3.5 shadow-2xs ${className}`}
      >
        {optionKeys.map((key) => {
          const values = optionValuesMap[key] || []
          const selectedVal = selectedOptions[key]
          const isColor =
            key.toLowerCase() === 'color' ||
            key.toLowerCase().includes('color') ||
            key.toLowerCase() === 'colour'

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                  {key.charAt(0).toUpperCase() + key.slice(1)}:
                </span>
                <span className="font-bold text-[#00407a] dark:text-blue-400">
                  {selectedVal || 'Select'}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {values.map((val) => {
                  const isSelected = selectedVal === val
                  const matchingVar = variants.find(
                    (v) =>
                      v.attributes?.[key] === val &&
                      Object.entries(selectedOptions).every(
                        ([k, sVal]) => k === key || v.attributes?.[k] === sVal
                      )
                  )
                  const isAvailable = matchingVar ? matchingVar.stock > 0 : true

                  if (isColor) {
                    const hex = resolveColorHex(val)
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onSelectOption(key, val)}
                        aria-pressed={isSelected}
                        className={`min-h-[42px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 touch-manipulation shrink-0 cursor-pointer ${
                          isSelected
                            ? 'border-[#00407a] dark:border-blue-400 bg-blue-50/80 dark:bg-blue-950/40 text-[#00407a] dark:text-blue-300 ring-2 ring-[#00407a]/20 shadow-xs font-bold'
                            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-gray-300'
                        } ${!isAvailable ? 'opacity-40' : ''}`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shadow-xs shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <span>{val}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#00407a] dark:text-blue-400" />
                        )}
                      </button>
                    )
                  }

                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onSelectOption(key, val)}
                      aria-pressed={isSelected}
                      className={`min-h-[40px] px-4 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 touch-manipulation shrink-0 cursor-pointer ${
                        isSelected
                          ? 'border-[#00407a] bg-[#00407a] text-white shadow-xs font-bold'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                      } ${!isAvailable ? 'opacity-40' : ''}`}
                    >
                      <span>{val}</span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 2. If category-based configurable attributes exist
  if (configurableAttributes.length > 0) {
    return (
      <div
        data-testid="mobile-attribute-selector"
        className={`bg-white dark:bg-[#0f172a] rounded-2xl p-3.5 border border-gray-200/80 dark:border-slate-800 space-y-3.5 shadow-2xs ${className}`}
      >
        {configurableAttributes.map((attr) => {
          const selectedVal = selectedOptions[attr.slug]
          const selectedOpt = attr.options.find((o) => o.value === selectedVal)
          const displaySelected = selectedOpt?.label || selectedVal

          return (
            <div key={attr.slug} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                  {attr.name}:
                </span>
                <span className="font-bold text-[#00407a] dark:text-blue-400">
                  {displaySelected || 'Select'}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {attr.options.map((opt) => {
                  const isSelected = selectedVal === opt.value

                  if (attr.isColor) {
                    const hex = resolveColorHex(opt.value, opt.hex)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onSelectOption(attr.slug, opt.value)}
                        aria-pressed={isSelected}
                        className={`min-h-[42px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 touch-manipulation shrink-0 cursor-pointer ${
                          isSelected
                            ? 'border-[#00407a] dark:border-blue-400 bg-blue-50/80 dark:bg-blue-950/40 text-[#00407a] dark:text-blue-300 ring-2 ring-[#00407a]/20 shadow-xs font-bold'
                            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shadow-xs shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <span>{opt.label}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#00407a] dark:text-blue-400" />
                        )}
                      </button>
                    )
                  }

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onSelectOption(attr.slug, opt.value)}
                      aria-pressed={isSelected}
                      className={`min-h-[40px] px-4 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 touch-manipulation shrink-0 cursor-pointer ${
                        isSelected
                          ? 'border-[#00407a] bg-[#00407a] text-white shadow-xs font-bold'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return null
}
