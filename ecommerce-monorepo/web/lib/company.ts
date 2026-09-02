/**
 * Server-side helpers for reading the company name / system settings
 * from the database.
 *
 * IMPORTANT: This module imports `@/lib/db` (Prisma). Only import it from
 * server code (server components, route handlers, scripts). For the
 * fallback constant in client components, import from
 * `@/lib/company-constants` instead.
 */

import { cache } from 'react'
import { prisma } from '@/lib/db'
import {
  DEFAULT_COMPANY,
  DEFAULT_COMPANY_NAME,
  resolveCompanyName,
} from '@/lib/company-constants'
import { localizeSystemSetting } from '@/lib/utils/localize'

export type SystemSettings = {
  id?: string
  companyName: string
  siteTagline?: string | null
  companyAddress?: string | null
  companyPhone?: string | null
  companyEmail?: string | null
  companyWebsite?: string | null
  companyDescription?: string | null
  companyLogo?: string | null
  companyLogoHeight?: number | null
  companyFavicon?: string | null
  primaryColor?: string | null
  accentColor?: string | null
  currency?: string | null
  timezone?: string | null
  language?: string | null
  facebookUrl?: string | null
  twitterUrl?: string | null
  linkedinUrl?: string | null
  instagramUrl?: string | null
  youtubeUrl?: string | null
  whatsappNumber?: string | null
  wechatId?: string | null
  [key: string]: any
}

/**
 * Cached fetch of the (single) SystemSettings row with locale support.
 */
export const getSystemSettings = cache(
  async (locale: string = 'en'): Promise<SystemSettings | null> => {
    try {
      const settings = await prisma.systemSettings.findFirst({
        include: {
          translations: true,
        },
      })
      if (!settings) return null

      const localizedName = localizeSystemSetting(
        settings.translations,
        'companyName',
        settings.companyName,
        locale
      )
      const localizedDescription = localizeSystemSetting(
        settings.translations,
        'companyDescription',
        settings.companyDescription,
        locale
      )
      const localizedAddress = localizeSystemSetting(
        settings.translations,
        'companyAddress',
        settings.companyAddress,
        locale
      )

      return {
        ...settings,
        companyName: localizedName || settings.companyName,
        companyDescription: localizedDescription || settings.companyDescription,
        companyAddress: localizedAddress || settings.companyAddress,
      } as SystemSettings
    } catch (error) {
      console.error('[company] Failed to fetch system settings:', error)
      return null
    }
  }
)

/** Returns the database company name, or the safe default if unavailable. */
export async function getCompanyName(locale: string = 'en'): Promise<string> {
  const settings = await getSystemSettings(locale)
  return resolveCompanyName(settings?.companyName)
}

/** Returns the database site tagline (slogan), or empty string if unavailable. */
export async function getSiteTagline(locale: string = 'en'): Promise<string> {
  const settings = await getSystemSettings(locale)
  return settings?.siteTagline?.trim() || ''
}

/** Returns the database company description, or safe fallback if unavailable. */
export async function getCompanyDescription(locale: string = 'en'): Promise<string> {
  const settings = await getSystemSettings(locale)
  return settings?.companyDescription?.trim() || DEFAULT_COMPANY.companyDescription
}

/** Default settings object used by API routes / emails when DB is empty. */
export const defaultSystemSettings: SystemSettings = { ...DEFAULT_COMPANY }

export { DEFAULT_COMPANY, DEFAULT_COMPANY_NAME, resolveCompanyName }
