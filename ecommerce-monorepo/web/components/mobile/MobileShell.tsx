'use client'

import React from 'react'
import { MobileHeader, MobileHeaderProps } from './MobileHeader'
import { MobileSearch, MobileSearchProps } from './MobileSearch'
import { MobileDrawer, MobileDrawerProps } from './MobileDrawer'
import { BottomNav } from './BottomNav'
import { useMobile } from '@/components/MobileProvider'

export interface MobileShellProps {
  children: React.ReactNode
  showHeader?: boolean
  headerProps?: Partial<MobileHeaderProps>
  showSearch?: boolean
  searchProps?: Partial<MobileSearchProps>
  showDrawer?: boolean
  drawerProps?: Partial<MobileDrawerProps>
  showBottomNav?: boolean
  title?: string
  showBack?: boolean
  backHref?: string
  onBack?: () => void
  className?: string
}

export function MobileShell({
  children,
  showHeader = true,
  headerProps,
  showSearch = true,
  searchProps,
  showDrawer = true,
  drawerProps,
  showBottomNav = true,
  title,
  showBack = false,
  backHref,
  onBack,
  className = '',
}: MobileShellProps) {
  const { isDrawerOpen, closeDrawer } = useMobile()

  return (
    <div
      data-testid="mobile-shell"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] text-gray-900 dark:text-slate-100 ${className}`}
    >
      {/* 1. Mobile Header (56px sticky top) */}
      {showHeader && (
        <MobileHeader
          title={title}
          showBack={showBack}
          backHref={backHref}
          onBack={onBack}
          showSearchToggle={showSearch}
          {...headerProps}
        />
      )}

      {/* 2. Collapsible Sticky Search Bar */}
      {showSearch && <MobileSearch {...searchProps} />}

      {/* 3. Main Page Content */}
      <main
        data-testid="mobile-main-content"
        className={`flex-1 w-full max-w-lg mx-auto ${
          showHeader ? 'pt-[calc(56px+env(safe-area-inset-top,0px))]' : ''
        } ${showBottomNav ? 'pb-20' : 'pb-6'}`}
      >
        {children}
      </main>

      {/* 4. Global Navigation Drawer */}
      {showDrawer && (
        <MobileDrawer
          isOpen={drawerProps?.isOpen !== undefined ? drawerProps.isOpen : isDrawerOpen}
          onClose={drawerProps?.onClose || closeDrawer}
          {...drawerProps}
        />
      )}

      {/* 5. Bottom Navigation Bar */}
      {showBottomNav && <BottomNav />}
    </div>
  )
}
