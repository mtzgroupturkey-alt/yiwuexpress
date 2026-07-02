'use client'

import { useState } from 'react'
import { ColorSwatch } from '@/components/ui/ColorSwatch'

export interface ColorFilterProps {
  colors: { label: string; value: string }[]
  selectedColors: string[]
  onChange: (selected: string[]) => void
}

export function ColorFilter({ colors, selectedColors, onChange }: ColorFilterProps) {
  const toggleColor = (colorValue: string) => {
    if (selectedColors.includes(colorValue)) {
      onChange(selectedColors.filter(c => c !== colorValue))
    } else {
      onChange([...selectedColors, colorValue])
    }
  }

  if (!colors || colors.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Colors</h3>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <ColorSwatch
            key={color.value}
            color={color.value}
            label={color.label}
            selected={selectedColors.includes(color.value)}
            onClick={() => toggleColor(color.value)}
            size="md"
            showLabel
          />
        ))}
      </div>
    </div>
  )
}
