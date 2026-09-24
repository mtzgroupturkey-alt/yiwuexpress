'use client'

import { useState, useEffect, useCallback } from 'react'

export type DisplayMode = 'standalone' | 'browser' | 'minimal-ui' | 'fullscreen'

export interface DisplayModeState {
  isStandalone: boolean
  isBrowser: boolean
  isMinimalUI: boolean
  mode: DisplayMode
}

/**
 * Determine the current display mode of the application.
 * Returns 'standalone' if running as an installed PWA,
 * 'minimal-ui' if running in a minimal browser wrapper,
 * 'fullscreen' if running fullscreen,
 * and 'browser' if running inside a normal web browser.
 */
export function getClientDisplayMode(): DisplayMode {
  if (typeof window === 'undefined') return 'browser'

  // 1. Check iOS standalone mode
  if (Boolean((window.navigator as any)?.standalone)) {
    return 'standalone'
  }

  // 2. Check matchMedia display-mode queries
  if (typeof window.matchMedia === 'function') {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone'
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen'
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui'
    }
  }

  // 3. Check explicit URL query param (e.g. ?pwa=1 or ?display=standalone) for testing/QA
  try {
    const search = window.location?.search
    if (search && (search.includes('pwa=1') || search.includes('display=standalone'))) {
      return 'standalone'
    }
  } catch {}

  // 4. Fallback check for Android WebApp context
  if (document.referrer.startsWith('android-app://')) {
    return 'standalone'
  }

  return 'browser'
}

export function useDisplayMode(): DisplayModeState {
  // Default to browser mode for SSR to avoid layout shift and maintain SEO parity
  const [mode, setMode] = useState<DisplayMode>('browser')

  const updateMode = useCallback(() => {
    const currentMode = getClientDisplayMode()
    setMode((prev) => {
      if (prev !== currentMode && currentMode === 'standalone') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('pwa_analytics', {
              detail: { event: 'pwa_standalone_entered', timestamp: Date.now() },
            })
          )
        }
      }
      return currentMode
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Hydrate immediately on mount
    updateMode()

    // 1. Listen for display-mode media query changes
    const mediaQueries = [
      '(display-mode: standalone)',
      '(display-mode: minimal-ui)',
      '(display-mode: fullscreen)',
    ]

    const mqlList: MediaQueryList[] = []
    const handleMqlChange = () => updateMode()

    mediaQueries.forEach((query) => {
      if (typeof window.matchMedia === 'function') {
        const mql = window.matchMedia(query)
        if (mql.addEventListener) {
          mql.addEventListener('change', handleMqlChange)
        } else if ((mql as any).addListener) {
          ;(mql as any).addListener(handleMqlChange)
        }
        mqlList.push(mql)
      }
    })

    // 2. Listen for resize and visibilitychange
    window.addEventListener('resize', updateMode)
    document.addEventListener('visibilitychange', updateMode)

    return () => {
      mqlList.forEach((mql) => {
        if (mql.removeEventListener) {
          mql.removeEventListener('change', handleMqlChange)
        } else if ((mql as any).removeListener) {
          ;(mql as any).removeListener(handleMqlChange)
        }
      })
      window.removeEventListener('resize', updateMode)
      document.removeEventListener('visibilitychange', updateMode)
    }
  }, [updateMode])

  const isStandalone = mode === 'standalone'
  const isMinimalUI = mode === 'minimal-ui'
  const isBrowser = mode === 'browser'

  return {
    isStandalone,
    isBrowser,
    isMinimalUI,
    mode,
  }
}
