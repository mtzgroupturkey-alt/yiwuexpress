/**
 * Shared company branding constants.
 *
 * This module is SAFE to import from both server and client components
 * (it has no database or server-only imports). Use `DEFAULT_COMPANY_NAME`
 * as the fallback when the database-backed company name is not available.
 */

export const DEFAULT_COMPANY_NAME = 'Global Trade'

/**
 * Default system settings used as a fallback when no SystemSettings row
 * exists in the database. Keep in sync with the Prisma `SystemSettings`
 * model defaults.
 */
export const DEFAULT_COMPANY = {
  companyName: DEFAULT_COMPANY_NAME,
  companyAddress: 'China',
  companyPhone: '+86 579 8555 1234',
  companyEmail: 'info@yiwuexpress.com',
  companyWebsite: 'https://yiwuexpress.com',
  companyDescription:
    'Leading logistics and trade services provider connecting China to the world',
  companyLogo: '',
  companyLogoHeight: 40,
  companyFavicon: '',
  primaryColor: '#1a3a5c',
  accentColor: '#c9a84c',
  currency: 'USD',
  timezone: 'Asia/Shanghai',
  language: 'en',
} as const

/** Normalize a possibly-null/empty company name to the safe default. */
export function resolveCompanyName(name?: string | null): string {
  const trimmed = name?.trim()
  return trimmed ? trimmed : DEFAULT_COMPANY_NAME
}
