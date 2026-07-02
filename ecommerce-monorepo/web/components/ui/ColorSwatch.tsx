'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColorSwatchProps {
  color: string
  label?: string
  selected?: boolean
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
  disabled?: boolean
}

export function ColorSwatch({
  color,
  label,
  selected = false,
  onClick,
  size = 'md',
  showLabel = false,
  className,
  disabled = false,
}: ColorSwatchProps) {
  const [hovered, setHovered] = useState(false)

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const checkSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const labelSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  }

  // Determine if text checkmark should be white or dark based on color brightness
  const isLight = isLightColor(color)

  return (
    <div className={cn('flex flex-col items-center gap-1', showLabel && 'gap-1.5')}>
      <button
        type="button"
        title={label || color}
        disabled={disabled}
        className={cn(
          'relative rounded-full border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a5c] focus-visible:ring-offset-2',
          sizeClasses[size],
          selected
            ? 'border-[#1a3a5c] ring-2 ring-[#1a3a5c]/30 scale-110'
            : 'border-gray-200 hover:border-gray-400 hover:scale-105',
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
          className
        )}
        style={{ backgroundColor: color }}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {selected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Check
              className={cn(
                checkSizes[size],
                'drop-shadow-md',
                isLight ? 'text-gray-800' : 'text-white'
              )}
              strokeWidth={3}
            />
          </div>
        )}
        {hovered && !selected && !disabled && (
          <div className="absolute inset-0 rounded-full ring-2 ring-white/60" />
        )}
      </button>
      {showLabel && label && (
        <span className={cn('text-gray-600 text-center leading-tight max-w-[56px] truncate', labelSizes[size])}>
          {label}
        </span>
      )}
    </div>
  )
}

/** Determine if a hex color is light (so we use a dark checkmark) */
function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '')
  if (clean.length < 6) return false
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  // Perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}
