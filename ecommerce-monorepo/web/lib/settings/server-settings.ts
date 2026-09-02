import { cache } from 'react'
import { getSystemSettings } from '../company'
import { CompanySettings, DEFAULT_SETTINGS } from '../../stores/settingsStore'

/**
 * Server-side cached settings getter using React.cache().
 * Deduplicates calls within a single server render pass.
 */
export const getServerSettings = cache(async (locale = 'en'): Promise<CompanySettings> => {
  try {
    const raw = await getSystemSettings(locale)
    if (!raw) return DEFAULT_SETTINGS

    return {
      id: raw.id,
      companyName: raw.companyName || DEFAULT_SETTINGS.companyName,
      siteTagline: raw.siteTagline || undefined,
      companyAddress: raw.companyAddress || undefined,
      companyPhone: raw.companyPhone || undefined,
      companyEmail: raw.companyEmail || undefined,
      companyWebsite: raw.companyWebsite || undefined,
      businessLicense: raw.businessLicense || undefined,
      taxRegistrationNumber: raw.taxRegistrationNumber || undefined,
      companyDescription: raw.companyDescription || undefined,
      companyLogo: raw.companyLogo || undefined,
      companyLogoHeight: raw.companyLogoHeight || 40,
      companyFavicon: raw.companyFavicon || '/favicon.svg',
      primaryColor: raw.primaryColor || DEFAULT_SETTINGS.primaryColor,
      accentColor: raw.accentColor || DEFAULT_SETTINGS.accentColor,
      currency: raw.currency || DEFAULT_SETTINGS.currency,
      timezone: raw.timezone || DEFAULT_SETTINGS.timezone,
      language: raw.language || locale,
      storeMode: (raw.storeMode as any) || DEFAULT_SETTINGS.storeMode,
    }
  } catch (error) {
    console.error('[getServerSettings] Failed to fetch settings, using fallback defaults:', error)
    return DEFAULT_SETTINGS
  }
})
