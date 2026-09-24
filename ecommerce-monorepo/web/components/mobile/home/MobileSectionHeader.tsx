'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { useLocale } from 'next-intl'

export interface MobileSectionHeaderProps {
  title: string
  subtitle?: string
  badge?: string
  onViewAll?: () => void
  viewAllLabel?: string
  className?: string
}

export function MobileSectionHeader({
  title,
  subtitle,
  badge,
  onViewAll,
  viewAllLabel,
  className = '',
}: MobileSectionHeaderProps) {
  const locale = useLocale()

  const defaultViewAll =
    locale === 'zh' ? '查看全部' : locale === 'ru' ? 'Все' : 'View All'
  const effectiveViewAllLabel = viewAllLabel || defaultViewAll

  return (
    <div
      data-testid="mobile-section-header"
      className={`flex items-center justify-between px-4 py-2 ${className}`}
    >
      <div className="min-w-0 flex-1 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
            {title}
          </h3>
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>

      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          aria-label={effectiveViewAllLabel}
          className="min-h-[44px] min-w-[44px] -mr-2 px-2 flex items-center justify-end gap-0.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 active:opacity-75 transition-opacity touch-manipulation cursor-pointer shrink-0"
        >
          <span>{effectiveViewAllLabel}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
