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

export type SystemSettings = {
  id?: string
  companyName: string
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
 * Cached fetch of the (single) SystemSettings row. `cache()` dedupes
 * calls within a single server request, avoiding repeated DB queries for
 * metadata, JSON-LD, providers, etc.
 */
export const getSystemSettings = cache(
  async (): Promise<SystemSettings | null> => {
    try {
      const settings = await prisma.systemSettings.findFirst()
      return (settings as SystemSettings) ?? null
    } catch (error) {
      console.error('[company] Failed to fetch system settings:', error)
      return null
    }
  }
)

/** Returns the database company name, or the safe default if unavailable. */
export async function getCompanyName(): Promise<string> {
  const settings = await getSystemSettings()
  return resolveCompanyName(settings?.companyName)
}

/** Default settings object used by API routes / emails when DB is empty. */
export const defaultSystemSettings: SystemSettings = { ...DEFAULT_COMPANY }

export { DEFAULT_COMPANY, DEFAULT_COMPANY_NAME, resolveCompanyName }
