'use client'

import { useState, useMemo } from 'react'
import { Plus, X, Palette } from 'lucide-react'
import { ColorSwatch } from './ColorSwatch'
import { Input } from './input'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { getLocalizedColorName } from '@/lib/utils/attributeOptionTranslations'

export interface ColorOption {
  label: string
  value: string // hex color
}

/** Rich set of standard default colors for e-commerce products */
export const DEFAULT_COLORS: ColorOption[] = [
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Gray', value: '#6B7280' },
  { label: 'Silver', value: '#E5E7EB' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Burgundy', value: '#7F1D1D' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Rose', value: '#F43F5E' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Yellow', value: '#EAB308' },
  { label: 'Gold', value: '#D97706' },
  { label: 'Beige', value: '#D4B996' },
  { label: 'Brown', value: '#78350F' },
  { label: 'Green', value: '#10B981' },
  { label: 'Dark Green', value: '#064E3B' },
  { label: 'Olive', value: '#65A30D' },
  { label: 'Teal', value: '#14B8A6' },
  { label: 'Cyan', value: '#06B6D4' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Navy', value: '#1E3A8A' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Violet', value: '#5B21B6' },
]

interface ColorSelectorProps {
  options?: ColorOption[]
  selected: string[]             // array of selected hex values
  onChange: (selected: string[]) => void
  multi?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  maxSelect?: number
  allowCustomColor?: boolean
  locale?: 'en' | 'ru' | 'zh' | string
  className?: string
}

export function ColorSelector({
  options = [],
  selected = [],
  onChange,
  multi = true,
  size = 'md',
  showLabels = true,
  maxSelect,
  allowCustomColor = true,
  locale = 'en',
  className,
}: ColorSelectorProps) {
  const [customColors, setCustomColors] = useState<ColorOption[]>([])
  const [pickerHex, setPickerHex] = useState('#2563EB')
  const [hexInput, setHexInput] = useState('')
  const [showHexInput, setShowHexInput] = useState(false)

  // Merge attribute options, custom picked colors, and default palette
  const allOptions = useMemo(() => {
    const list: ColorOption[] = []
    const seen = new Set<string>()

    // 1. First priority: attribute-defined options
    if (Array.isArray(options) && options.length > 0) {
      for (const opt of options) {
        const val = opt.value.toLowerCase()
        if (!seen.has(val)) {
          seen.add(val)
          list.push(opt)
        }
      }
    }

    // 2. Custom colors picked by user in this session
    for (const opt of customColors) {
      const val = opt.value.toLowerCase()
      if (!seen.has(val)) {
        seen.add(val)
        list.push(opt)
      }
    }

    // 3. Any selected colors that aren't in the list yet
    for (const val of selected) {
      const lower = val.toLowerCase()
      if (!seen.has(lower)) {
        seen.add(lower)
        list.push({ label: val.toUpperCase(), value: val })
      }
    }

    // 4. Default palette colors
    for (const def of DEFAULT_COLORS) {
      const val = def.value.toLowerCase()
      if (!seen.has(val)) {
        seen.add(val)
        list.push(def)
      }
    }

    return list
  }, [options, customColors, selected])

  const handleToggle = (value: string) => {
    const norm = value.toUpperCase()
    const isSelected = selected.some(v => v.toLowerCase() === value.toLowerCase())

    if (multi) {
      if (isSelected) {
        onChange(selected.filter(v => v.toLowerCase() !== value.toLowerCase()))
      } else {
        if (maxSelect && selected.length >= maxSelect) return
        onChange([...selected, norm])
      }
    } else {
      // Single select toggle
      onChange(isSelected ? [] : [norm])
    }
  }

  const handleAddColor = (hex: string, label?: string) => {
    let clean = hex.trim()
    if (!clean.startsWith('#')) clean = `#${clean}`
    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(clean)) return

    const norm = clean.toUpperCase()
    const entryLabel = label?.trim() || norm

    // Add to custom list if not already in allOptions
    if (!allOptions.some(o => o.value.toLowerCase() === clean.toLowerCase())) {
      setCustomColors(prev => [...prev, { label: entryLabel, value: norm }])
    }

    // Automatically select it
    if (!selected.some(v => v.toLowerCase() === clean.toLowerCase())) {
      if (multi) {
        if (!maxSelect || selected.length < maxSelect) {
          onChange([...selected, norm])
        }
      } else {
        onChange([norm])
      }
    }

    setHexInput('')
    setShowHexInput(false)
  }

  const handleRemove = (value: string) => {
    onChange(selected.filter(v => v.toLowerCase() !== value.toLowerCase()))
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Swatches grid + Color Picker button */}
      <div className="flex flex-wrap items-center gap-2.5">
        {allOptions.map(option => (
          <ColorSwatch
            key={option.value}
            color={option.value}
            label={getLocalizedColorName(option.value, option.label, locale)}
            selected={selected.some(v => v.toLowerCase() === option.value.toLowerCase())}
            onClick={() => handleToggle(option.value)}
            size={size}
            showLabel={showLabels}
          />
        ))}

        {/* Interactive Color Picker */}
        {allowCustomColor && (
          <div className="flex flex-col items-center gap-1">
            <div
              className="relative w-8 h-8 rounded-full border-2 border-dashed border-gray-400 hover:border-[#1a3a5c] flex items-center justify-center cursor-pointer transition-all hover:scale-105 bg-gradient-to-br from-red-200 via-green-200 to-blue-200 shadow-sm"
              title="Pick a custom color"
            >
              <Palette className="w-4 h-4 text-gray-700 pointer-events-none drop-shadow-sm" />
              <input
                type="color"
                value={pickerHex}
                onChange={e => {
                  setPickerHex(e.target.value)
                  handleAddColor(e.target.value)
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                title="Select custom color via color picker"
              />
            </div>
            {showLabels && (
              <button
                type="button"
                onClick={() => setShowHexInput(prev => !prev)}
                className="text-[11px] text-gray-600 hover:text-[#1a3a5c] underline leading-tight truncate max-w-[56px]"
              >
                + Custom
              </button>
            )}
          </div>
        )}
      </div>

      {/* Optional manual Hex input toggle */}
      {showHexInput && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 max-w-xs animate-in fade-in duration-150">
          <div
            className="w-7 h-7 rounded-full border border-gray-300 shadow-inner flex-shrink-0"
            style={{ backgroundColor: pickerHex }}
          />
          <Input
            value={hexInput}
            onChange={e => setHexInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddColor(hexInput)
              }
            }}
            placeholder="#2563EB"
            className="h-8 font-mono text-xs uppercase"
            maxLength={7}
          />
          <Button
            type="button"
            size="sm"
            className="h-8 px-3 text-xs bg-[#1a3a5c] text-white hover:bg-[#2563eb]"
            onClick={() => handleAddColor(hexInput)}
          >
            Add
          </Button>
          <button
            type="button"
            onClick={() => setShowHexInput(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected colors badge pills */}
      {selected.length > 0 && (
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-600 mr-1">
            Selected ({selected.length}):
          </span>
          {selected.map(hex => {
            const opt = allOptions.find(o => o.value.toLowerCase() === hex.toLowerCase())
            const label = getLocalizedColorName(hex, opt?.label, locale)
            return (
              <span
                key={hex}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 shadow-sm transition-all hover:border-gray-300"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-inner flex-shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-gray-800">{label}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(hex)}
                  className="ml-0.5 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                  title={`Remove ${label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
          {multi && selected.length > 1 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-gray-400 hover:text-red-600 underline ml-2 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}

