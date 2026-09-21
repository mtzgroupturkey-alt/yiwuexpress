'use client'

import React from 'react'
import { PackageOpen, ArrowRight } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto space-y-3 ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-slate-800/80 text-gray-400 dark:text-slate-500 flex items-center justify-center shadow-inner">
        {icon || <PackageOpen className="w-8 h-8" />}
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-base text-gray-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="min-h-[48px] px-5 mt-2 rounded-2xl bg-primary-600 text-white font-bold text-xs flex items-center gap-2 active:scale-95 transition-transform touch-manipulation shadow-xs"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
