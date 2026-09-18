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
  rfqModel?: 'RFQ' | 'INSTANT'
  wholesaleDefaultMoq?: number
  rfqEnabled?: boolean
  wholesaleEnabled?: boolean
  retailEnabled?: boolean
  storeHours?: string
  freeShippingThreshold?: number
  announcementTicker?: string
  facebookUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  instagramUrl?: string
  whatsappNumber?: string
  wechatId?: string
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
  rfqModel: 'RFQ',
  wholesaleDefaultMoq: 1,
  rfqEnabled: true,
  wholesaleEnabled: true,
  retailEnabled: true,
  storeHours: '08:00 – 23:00',
  freeShippingThreshold: 35.0,
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
