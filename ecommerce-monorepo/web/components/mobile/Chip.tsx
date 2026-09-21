'use client'

import React from 'react'
import { X } from 'lucide-react'

interface ChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
  onRemove?: () => void
  icon?: React.ReactNode
  className?: string
}

export function Chip({
  label,
  selected = false,
  onClick,
  onRemove,
  icon,
  className = '',
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all active:scale-95 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shrink-0 ${
        selected
          ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
              onRemove()
            }
          }}
          aria-label={`Remove ${label}`}
          className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="w-3.5 h-3.5" />
        </span>
      )}
    </button>
  )
}
