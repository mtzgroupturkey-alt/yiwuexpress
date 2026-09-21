'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface MobileContextType {
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  isDrawerOpen?: boolean
  setIsDrawerOpen?: (open: boolean) => void
  openDrawer?: () => void
  closeDrawer?: () => void
  toggleDrawer?: () => void
  isSearchOpen?: boolean
  setIsSearchOpen?: (open: boolean) => void
  openSearch?: () => void
  closeSearch?: () => void
  toggleSearch?: () => void
}

const MobileContext = createContext<MobileContextType>({
  isMobile: false,
  isIOS: false,
  isAndroid: false,
  isDrawerOpen: false,
  setIsDrawerOpen: () => {},
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
  isSearchOpen: false,
  setIsSearchOpen: () => {},
  openSearch: () => {},
  closeSearch: () => {},
  toggleSearch: () => {},
})

export interface MobileProviderProps {
  children: React.ReactNode
  initialIsMobile?: boolean
  initialIsIOS?: boolean
  initialIsAndroid?: boolean
}

export function MobileProvider({
  children,
  initialIsMobile = false,
  initialIsIOS = false,
  initialIsAndroid = false,
}: MobileProviderProps) {
  const [isMobile, setIsMobile] = useState<boolean>(initialIsMobile)
  const [isIOS, setIsIOS] = useState<boolean>(initialIsIOS)
  const [isAndroid, setIsAndroid] = useState<boolean>(initialIsAndroid)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false)

  const openDrawer = () => setIsDrawerOpen(true)
  const closeDrawer = () => setIsDrawerOpen(false)
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev)

  const openSearch = () => setIsSearchOpen(true)
  const closeSearch = () => setIsSearchOpen(false)
  const toggleSearch = () => setIsSearchOpen((prev) => !prev)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Device OS checks from client userAgent if not already determined
    const ua = navigator.userAgent || ''
    if (!initialIsIOS && /iPhone|iPad|iPod/i.test(ua)) {
      setIsIOS(true)
    }
    if (!initialIsAndroid && /Android/i.test(ua)) {
      setIsAndroid(true)
    }

    // Media query check for viewport width <= 768px
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    
    const updateIsMobile = () => {
      // Mobile if viewport width <= 768px or user agent was identified as mobile/tablet
      const isViewportMobile = mediaQuery.matches
      const isUAMobile = initialIsMobile || /mobile|tablet|android|iphone|ipad|ipod/i.test(ua)
      setIsMobile(isViewportMobile || isUAMobile)
    }

    updateIsMobile()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateIsMobile)
      return () => mediaQuery.removeEventListener('change', updateIsMobile)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(updateIsMobile)
      return () => mediaQuery.removeListener(updateIsMobile)
    }
  }, [initialIsMobile, initialIsIOS, initialIsAndroid])

  return (
    <MobileContext.Provider
      value={{
        isMobile,
        isIOS,
        isAndroid,
        isDrawerOpen,
        setIsDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        isSearchOpen,
        setIsSearchOpen,
        openSearch,
        closeSearch,
        toggleSearch,
      }}
    >
      {children}
    </MobileContext.Provider>
  )
}

export function useMobile(): MobileContextType {
  const context = useContext(MobileContext)
  if (!context) {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isDrawerOpen: false,
      setIsDrawerOpen: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
      toggleDrawer: () => {},
      isSearchOpen: false,
      setIsSearchOpen: () => {},
      openSearch: () => {},
      closeSearch: () => {},
      toggleSearch: () => {},
    }
  }
  return context
}
