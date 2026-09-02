'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useLocale } from 'next-intl'
import DynamicFavicon from './DynamicFavicon'

interface CompanySettings {
  id?: string
  companyName: string
  siteTagline?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyWebsite?: string
  businessLicense?: string
  taxRegistrationNumber?: string
  companyDescription?: string
  companyLogo?: string
  companyLogoHeight?: number
  companyFavicon?: string
  primaryColor: string
  accentColor: string
  currency: string
  timezone: string
  language: string
  storeMode?: 'WHOLESALE' | 'RETAIL' | 'BOTH'
}

interface SettingsContextType {
  settings: CompanySettings | null
  loading: boolean
  refreshSettings: () => void
  storeMode: 'WHOLESALE' | 'RETAIL' | 'BOTH'
  isWholesaleOnly: boolean
  isRetailOnly: boolean
  isHybridMode: boolean
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  refreshSettings: () => {},
  storeMode: 'WHOLESALE',
  isWholesaleOnly: true,
  isRetailOnly: false,
  isHybridMode: false
})

export const useSettings = () => useContext(SettingsContext)

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const locale = useLocale()
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/settings/public?locale=${encodeURIComponent(locale || 'en')}`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [locale])

  const refreshSettings = () => {
    setLoading(true)
    fetchSettings()
  }

  const storeMode = settings?.storeMode || 'WHOLESALE'

  const value: SettingsContextType = {
    settings,
    loading,
    refreshSettings,
    storeMode,
    isWholesaleOnly: storeMode === 'WHOLESALE',
    isRetailOnly: storeMode === 'RETAIL',
    isHybridMode: storeMode === 'BOTH',
  }

  return (
    <SettingsContext.Provider value={value}>
      {settings?.companyFavicon && <DynamicFavicon faviconUrl={settings.companyFavicon} />}
      {children}
    </SettingsContext.Provider>
  )
}