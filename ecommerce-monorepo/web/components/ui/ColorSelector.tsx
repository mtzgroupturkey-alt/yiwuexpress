'use client'

import { ColorSwatch } from './ColorSwatch'
import { cn } from '@/lib/utils'

export interface ColorOption {
  label: string
  value: string // hex color
}

interface ColorSelectorProps {
  options: ColorOption[]
  selected: string[]             // array of selected hex values
  onChange: (selected: string[]) => void
  multi?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  maxSelect?: number
  className?: string
}

export function ColorSelector({
  options,
  selected,
  onChange,
  multi = true,
  size = 'md',
  showLabels = true,
  maxSelect,
  className,
}: ColorSelectorProps) {
  const handleToggle = (value: string) => {
    if (multi) {
      if (selected.includes(value)) {
        onChange(selected.filter(v => v !== value))
      } else {
        if (maxSelect && selected.length >= maxSelect) return
        onChange([...selected, value])
      }
    } else {
      // Single-select: clicking selected item deselects it
      onChange(selected.includes(value) ? [] : [value])
    }
  }

  if (!options || options.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">No color options defined</p>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {options.map(option => (
        <ColorSwatch
          key={option.value}
          color={option.value}
          label={option.label}
          selected={selected.includes(option.value)}
          onClick={() => handleToggle(option.value)}
          size={size}
          showLabel={showLabels}
        />
      ))}
    </div>
  )
}
