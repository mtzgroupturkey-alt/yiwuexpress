'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import {
  Search,
  Globe,
  Menu,
  X,
  LogOut,
  User as UserIcon,
} from 'lucide-react'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'
import { navigationConfig, ADMIN_NAV_ITEMS, isItemActive } from './navigationConfig'
import { SidebarGroup } from './SidebarGroup'
import { SidebarItem } from './SidebarItem'
import { cn } from '@/lib/utils'

export { ADMIN_NAV_ITEMS }

export interface AdminSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  logoUrl?: string
  companyName: string
  primaryColor?: string
  accentColor?: string
  onLogout: () => void
}

function AdminSidebarContent({
  sidebarOpen,
  setSidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  logoUrl,
  companyName,
  primaryColor,
  accentColor,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { dict } = useAdminLocale()

  // Track expanded groups (all collapsed by default except current active group)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['dashboard'])
  const [searchQuery, setSearchQuery] = useState('')

  // Live badge counts from /api/admin/stats
  const [badgeCounts, setBadgeCounts] = useState<{
    pendingOrders: number
    pendingQuotes: number
    lowStock: number
    newInquiries: number
  }>({
    pendingOrders: 0,
    pendingQuotes: 0,
    lowStock: 0,
    newInquiries: 0,
  })

  // Fetch real-time pending notification counts
  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success || data.pendingQuotes !== undefined) {
          const quotes = data.pendingQuotes ?? data.data?.overview?.pendingQuotes ?? 0
          const lowStock = data.lowStockProducts ?? data.data?.overview?.lowStockProducts ?? 0
          const pendingOrdersItem = (data.ordersByStatus || data.data?.ordersByStatus || []).find(
            (s: any) => s.status === 'PENDING'
          )
          const pendingOrders = pendingOrdersItem
            ? pendingOrdersItem.count || pendingOrdersItem._count || 0
            : 0

          const newInquiriesItem = (data.wholesaleByStatus || data.data?.wholesaleByStatus || []).find(
            (s: any) => s.status === 'NEW'
          )
          const newInquiries = newInquiriesItem
            ? newInquiriesItem.count || newInquiriesItem._count || 0
            : 0

          setBadgeCounts({
            pendingOrders,
            pendingQuotes: quotes,
            lowStock,
            newInquiries,
          })
        }
      })
      .catch((err) => console.error('Error fetching sidebar badges:', err))
  }, [pathname, searchParams])

  // Automatically expand the group containing the active page
  useEffect(() => {
    navigationConfig.forEach((group) => {
      const isInside = group.items.some((item) =>
        isItemActive(item.href, pathname, searchParams)
      )
      if (isInside) {
        setExpandedGroups((prev) => (prev.includes(group.id) ? prev : [...prev, group.id]))
      }
    })
  }, [pathname, searchParams])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    )
  }

  // Filter groups and items when searching
  const filteredGroups = navigationConfig
    .map((group) => {
      if (!searchQuery.trim()) return group

      const q = searchQuery.toLowerCase().trim()
      const groupMatches =
        group.label.toLowerCase().includes(q) ||
        ((dict?.nav as any)?.[group.translationKey] || '').toLowerCase().includes(q)

      const matchingItems = group.items.filter((item) => {
        const itemLabel = (dict?.nav as any)?.[item.translationKey] || item.label
        return itemLabel.toLowerCase().includes(q) || item.href.toLowerCase().includes(q)
      })

      if (groupMatches || matchingItems.length > 0) {
        return {
          ...group,
          items: groupMatches ? group.items : matchingItems,
        }
      }
      return null
    })
    .filter(Boolean) as typeof navigationConfig

  const renderSidebarBody = (isMobile: boolean = false, isCollapsed: boolean = false) => (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* 1. Header / Logo Area */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-slate-100 shrink-0',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        <Link
          href="/admin"
          onClick={() => isMobile && setMobileMenuOpen(false)}
          title={companyName || 'Dromkok'}
          className={cn('flex items-center min-w-0', isCollapsed ? 'justify-center' : 'gap-2.5')}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 border border-blue-100 overflow-hidden relative shrink-0">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo" fill sizes="32px" className="object-contain" />
            ) : (
              <Globe size={18} className="text-blue-600" />
            )}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight text-slate-900 block truncate">
                {companyName || 'Dromkok'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block -mt-0.5">
                Admin Console
              </span>
            </div>
          )}
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 2. Menu Search Filter Bar (only when expanded) */}
      {!isCollapsed && (
        <div className="px-3 pt-3 pb-2 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={dict?.commandPalette?.searchPlaceholder || 'Search menu...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Navigation Groups List */}
      <nav
        className={cn(
          'flex-1 overflow-y-auto space-y-1',
          isCollapsed ? 'px-2 py-3 divide-y-0' : 'px-3 py-3 divide-y divide-slate-100/80'
        )}
      >
        {filteredGroups.map((group) => {
          const isExpanded = searchQuery.trim().length > 0 || expandedGroups.includes(group.id)

          return (
            <div key={group.id} className={cn(!isCollapsed && 'pt-2 first:pt-0')}>
              <SidebarGroup
                group={group}
                isExpanded={isExpanded}
                onToggle={() => {
                  if (isCollapsed) {
                    setSidebarOpen(true)
                  }
                  toggleGroup(group.id)
                }}
                currentPathname={pathname}
                searchParams={searchParams}
                dict={dict}
                badgeCounts={badgeCounts}
                isCollapsed={isCollapsed}
                onItemClick={() => isMobile && setMobileMenuOpen(false)}
              />
            </div>
          )
        })}

        {!isCollapsed && filteredGroups.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            No menu items match &quot;{searchQuery}&quot;
          </div>
        )}
      </nav>

      {/* 4. Footer: Profile & Logout */}
      <div
        className={cn(
          'border-t border-slate-100 bg-slate-50/70 shrink-0 space-y-1',
          isCollapsed ? 'p-2 flex flex-col items-center' : 'p-3'
        )}
      >
        <Link
          href="/admin/users"
          onClick={() => isMobile && setMobileMenuOpen(false)}
          title="Administrator (admin@dromkok.com)"
          className={cn(
            'rounded-xl hover:bg-white border border-transparent hover:border-slate-200/80 transition-all group',
            isCollapsed
              ? 'w-10 h-10 flex items-center justify-center'
              : 'flex items-center gap-2.5 px-2.5 py-1.5'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
            <UserIcon size={14} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">Administrator</div>
              <div className="text-[11px] text-slate-400 truncate">admin@dromkok.com</div>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={onLogout}
          title={dict?.nav?.logout || 'Sign Out'}
          className={cn(
            'rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors',
            isCollapsed
              ? 'w-10 h-10 flex items-center justify-center'
              : 'w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left'
          )}
        >
          <LogOut size={15} />
          {!isCollapsed && <span>{dict?.nav?.logout || 'Sign Out'}</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity animate-in fade-in-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebarBody(true, false)}
      </aside>

      {/* Desktop Persistent Sidebar (w-72 when expanded, w-20 rail when collapsed) */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 border-r border-slate-200/90 h-screen transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-72' : 'w-20'
        )}
      >
        {renderSidebarBody(false, !sidebarOpen)}
      </aside>
    </>
  )
}

export function AdminSidebar(props: AdminSidebarProps) {
  return (
    <Suspense fallback={null}>
      <AdminSidebarContent {...props} />
    </Suspense>
  )
}

