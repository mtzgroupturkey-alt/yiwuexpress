'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import DynamicFavicon from './DynamicFavicon'

interface CompanySettings {
  id?: string
  companyName: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyWebsite?: string
  businessLicense?: string
  taxRegistrationNumber?: string
  companyDescription?: string
  companyLogo?: string
  companyFavicon?: string
  primaryColor: string
  accentColor: string
  currency: string
  timezone: string
  language: string
}

interface SettingsContextType {
  settings: CompanySettings | null
  loading: boolean
  refreshSettings: () => void
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  refreshSettings: () => {}
})

export const useSettings = () => useContext(SettingsContext)

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/public')
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
  }, [])

  const refreshSettings = () => {
    setLoading(true)
    fetchSettings()
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {settings?.companyFavicon && <DynamicFavicon faviconUrl={settings.companyFavicon} />}
      {children}
    </SettingsContext.Provider>
  )
}