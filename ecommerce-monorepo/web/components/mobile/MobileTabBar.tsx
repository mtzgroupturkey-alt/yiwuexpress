'use client'

import React from 'react'

export interface TabItem {
  id: string
  label: string
  count?: number
}

interface MobileTabBarProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function MobileTabBar({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: MobileTabBarProps) {
  return (
    <div
      role="tablist"
      className={`md:hidden flex items-center border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] overflow-x-auto no-scrollbar ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`min-h-[48px] px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              isActive
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
