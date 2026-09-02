'use client'

import React, { useEffect, useRef } from 'react'
import { useStoreSessionStore, StoreMode } from '@/stores/storeSessionStore'
import { useSettingsStore, CompanySettings } from '@/stores/settingsStore'

export interface StoreSessionProviderProps {
  initialStoreMode?: StoreMode
  initialSettings?: CompanySettings | null
  children: React.ReactNode
}

export function StoreSessionProvider({
  initialStoreMode,
  initialSettings,
  children,
}: StoreSessionProviderProps) {
  const initialized = useRef(false)

  if (!initialized.current) {
    if (initialStoreMode) {
      useStoreSessionStore.getState().initializeStoreMode(initialStoreMode)
    }
    if (initialSettings) {
      useSettingsStore.getState().initializeSettings(initialSettings)
    }
    initialized.current = true
  }

  useEffect(() => {
    // Check URL query parameters for session mode
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('mode') === 'wholesale') {
        useStoreSessionStore.getState().enableWholesaleSession()
      }
    }
  }, [])

  return <>{children}</>
}
