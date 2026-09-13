'use client'

import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { NavGroup } from './navigationConfig'
import { SidebarItem } from './SidebarItem'
import { cn } from '@/lib/utils'

interface SidebarGroupProps {
  group: NavGroup
  isExpanded: boolean
  onToggle: () => void
  currentPathname: string
  dict: any
  badgeCounts: Record<string, number>
  isCollapsed?: boolean
  onItemClick?: () => void
}

export function SidebarGroup({
  group,
  isExpanded,
  onToggle,
  currentPathname,
  dict,
  badgeCounts,
  isCollapsed = false,
  onItemClick,
}: SidebarGroupProps) {
  const GroupIcon = group.icon
  const hasActiveChild = group.items.some(
    (item) =>
      currentPathname === item.href ||
      (item.href !== '/admin' && currentPathname.startsWith(item.href))
  )

  const groupLabel = dict?.nav?.[group.translationKey] || group.label
  const displayLabel = groupLabel

  // Sum any badges inside this group
  const totalGroupBadge = group.items.reduce((sum, item) => {
    if (item.badgeKey && badgeCounts[item.badgeKey]) {
      return sum + badgeCounts[item.badgeKey]
    }
    return sum
  }, 0)

  if (isCollapsed) {
    return (
      <div className="relative group/rail flex flex-col items-center mb-2">
        {/* Rail Group Icon Button */}
        <button
          type="button"
          onClick={onToggle}
          title={displayLabel}
          className={cn(
            'relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150',
            hasActiveChild
              ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs ring-1 ring-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <GroupIcon className={cn('w-5 h-5 shrink-0', hasActiveChild ? 'text-blue-600' : 'text-slate-500')} />
          {totalGroupBadge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white font-mono shadow-xs">
              {totalGroupBadge}
            </span>
          )}
        </button>

        {/* Hover Popover Flyout showing group title and child items */}
        <div className="fixed left-20 ml-1 hidden group-hover/rail:flex flex-col bg-white border border-slate-200 shadow-xl rounded-2xl p-2 min-w-[200px] z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              {displayLabel}
            </span>
          </div>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive =
                currentPathname === item.href ||
                (item.href !== '/admin' && currentPathname.startsWith(item.href))
              const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : undefined

              return (
                <SidebarItem
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  dict={dict}
                  badgeCount={badgeCount}
                  isCollapsed={false}
                  onClick={onItemClick}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-2.5 select-none">
      {/* Group Header Button */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] uppercase tracking-wider font-bold transition-all duration-150',
          hasActiveChild
            ? 'text-blue-700 bg-blue-50/70'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
        )}
      >
        <GroupIcon className={cn('w-4 h-4 shrink-0', hasActiveChild ? 'text-blue-600' : 'text-slate-400')} />
        <span className="flex-1 text-left truncate">{displayLabel}</span>
        
        {totalGroupBadge > 0 && !isExpanded && (
          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-100 text-red-700 font-mono mr-1">
            {totalGroupBadge}
          </span>
        )}

        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" />
        )}
      </button>

      {/* Group Child Items */}
      {isExpanded && (
        <div className="mt-1 pl-2.5 border-l-2 border-slate-100 ml-3.5 space-y-0.5 animate-in fade-in-50 duration-200">
          {group.items.map((item) => {
            const isActive =
              currentPathname === item.href ||
              (item.href !== '/admin' && currentPathname.startsWith(item.href))
            const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : undefined

            return (
              <SidebarItem
                key={item.href}
                item={item}
                isActive={isActive}
                dict={dict}
                badgeCount={badgeCount}
                isCollapsed={false}
                onClick={onItemClick}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
