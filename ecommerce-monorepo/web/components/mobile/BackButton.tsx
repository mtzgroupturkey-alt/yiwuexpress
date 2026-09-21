'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronLeft } from 'lucide-react'

interface BackButtonProps {
  label?: string
  fallbackHref?: string
  variant?: 'chevron' | 'arrow'
  className?: string
  onClick?: () => void
}

export function BackButton({
  label,
  fallbackHref,
  variant = 'chevron',
  className = '',
  onClick,
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    if (window.history.length > 1) {
      router.back()
    } else if (fallbackHref) {
      router.push(fallbackHref)
    } else {
      router.push('/')
    }
  }

  const Icon = variant === 'arrow' ? ArrowLeft : ChevronLeft

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label || 'Go back'}
      className={`min-w-[48px] min-h-[48px] flex items-center justify-center -ml-2 text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white rounded-full active:scale-95 transition-transform touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${className}`}
    >
      <Icon className="w-6 h-6" />
      {label && (
        <span className="text-sm font-medium ml-1 select-none">{label}</span>
      )}
    </button>
  )
}
