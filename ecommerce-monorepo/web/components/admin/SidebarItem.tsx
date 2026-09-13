'use client'

import React from 'react'
import Link from 'next/link'
import { NavItem } from './navigationConfig'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  item: NavItem
  isActive: boolean
  dict: any
  badgeCount?: number
  isCollapsed?: boolean
  onClick?: () => void
}

export function SidebarItem({
  item,
  isActive,
  dict,
  badgeCount,
  isCollapsed = false,
  onClick,
}: SidebarItemProps) {
  const Icon = item.icon
  const label = dict?.nav?.[item.translationKey] || item.label

  if (isCollapsed) {
    return (
      <Link
        href={item.href}
        onClick={onClick}
        title={label}
        className={cn(
          'relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-150 group',
          isActive
            ? 'bg-blue-600 text-white shadow-xs font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        )}
      >
        {Icon && <Icon className="w-5 h-5 shrink-0" />}
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white font-mono shadow-xs">
            {badgeCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150',
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs border-l-4 border-blue-600 pl-2.5'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'w-[18px] h-[18px] shrink-0 transition-colors',
            isActive
              ? 'text-blue-600'
              : 'text-slate-400 group-hover:text-slate-700'
          )}
        />
      )}
      <span className="flex-1 truncate tracking-tight">{label}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <span
          className={cn(
            'px-2 py-0.5 text-[11px] font-bold rounded-full font-mono shrink-0 transition-colors',
            isActive
              ? 'bg-blue-600 text-white'
              : 'bg-red-50 text-red-600 border border-red-200'
          )}
        >
          {badgeCount}
        </span>
      )}
    </Link>
  )
}
