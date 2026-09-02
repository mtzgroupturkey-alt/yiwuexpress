import { create } from 'zustand'

export interface CompanySettings {
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

export interface SettingsState {
  settings: CompanySettings | null
  loading: boolean
  setSettings: (settings: Partial<CompanySettings>) => void
  initializeSettings: (initialSettings: CompanySettings | null) => void
  setLoading: (loading: boolean) => void
}

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'Global Trade',
  primaryColor: '#1a3a5c',
  accentColor: '#c9a84c',
  currency: 'USD',
  timezone: 'Asia/Shanghai',
  language: 'en',
  storeMode: 'WHOLESALE',
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,
  setSettings: (newSettings) =>
    set((state) => ({
      settings: state.settings
        ? { ...state.settings, ...newSettings }
        : { ...DEFAULT_SETTINGS, ...newSettings },
    })),
  initializeSettings: (initialSettings) =>
    set({
      settings: initialSettings ? { ...DEFAULT_SETTINGS, ...initialSettings } : DEFAULT_SETTINGS,
      loading: false,
    }),
  setLoading: (loading) => set({ loading }),
}))
