'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled, id, className }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        ref={ref}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-[#1a3a5c]' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    )
  }
)
Switch.displayName = 'Switch'

export { Switch }
