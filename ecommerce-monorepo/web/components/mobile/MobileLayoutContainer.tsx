'use client'

import React from 'react'
import { useMobile } from '@/components/MobileProvider'

interface MobileLayoutContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * MobileLayoutContainer wraps the primary layout <main> content.
 * In Standalone PWA mode, it adds pb-20 on mobile to prevent content
 * from being obscured by the fixed BottomNav bar.
 * In Browser mode, BottomNav is hidden and pb-0 is applied so the footer
 * and page content flow naturally without unwanted whitespace.
 * Desktop is always md:pb-0.
 */
export function MobileLayoutContainer({
  children,
  className = '',
}: MobileLayoutContainerProps) {
  const { isStandalone } = useMobile()

  return (
    <main
      data-testid="main-content-container"
      data-display-mode={isStandalone ? 'standalone' : 'browser'}
      className={`min-h-screen ${isStandalone ? 'pb-20' : 'pb-0'} md:pb-0 ${className}`}
    >
      {children}
    </main>
  )
}
