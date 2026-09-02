'use client'

import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react'
import { useLocale } from 'next-intl'
import DynamicFavicon from './DynamicFavicon'
import { useSettingsStore, CompanySettings, DEFAULT_SETTINGS } from '@/stores/settingsStore'

export type { CompanySettings }

export interface SettingsContextType {
  settings: CompanySettings | null
  loading: boolean
  refreshSettings: () => void
  storeMode: 'WHOLESALE' | 'RETAIL' | 'BOTH'
  isWholesaleOnly: boolean
  isRetailOnly: boolean
  isHybridMode: boolean
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: false,
  refreshSettings: () => {},
  storeMode: 'WHOLESALE',
  isWholesaleOnly: true,
  isRetailOnly: false,
  isHybridMode: false,
})

export const useSettings = () => useContext(SettingsContext)

interface SettingsProviderProps {
  initialSettings?: CompanySettings | null
  children: ReactNode
}

export function SettingsProvider({ initialSettings, children }: SettingsProviderProps) {
  const locale = useLocale()
  const settings = useSettingsStore((state) => state.settings)
  const loading = useSettingsStore((state) => state.loading)
  const setSettings = useSettingsStore((state) => state.setSettings)
  const setLoading = useSettingsStore((state) => state.setLoading)
  const initializeSettings = useSettingsStore((state) => state.initializeSettings)

  useEffect(() => {
    if (initialSettings) {
      initializeSettings(initialSettings)
    }
  }, [initialSettings, initializeSettings])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/settings/public?locale=${encodeURIComponent(locale || 'en')}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const storeMode = settings?.storeMode || 'WHOLESALE'

  const value: SettingsContextType = useMemo(
    () => ({
      settings: settings || DEFAULT_SETTINGS,
      loading,
      refreshSettings: fetchSettings,
      storeMode,
      isWholesaleOnly: storeMode === 'WHOLESALE',
      isRetailOnly: storeMode === 'RETAIL',
      isHybridMode: storeMode === 'BOTH',
    }),
    [settings, loading, storeMode]
  )

  return (
    <SettingsContext.Provider value={value}>
      {settings?.companyFavicon && <DynamicFavicon faviconUrl={settings.companyFavicon} />}
      {children}
    </SettingsContext.Provider>
  )
}
