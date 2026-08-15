'use client'

import { useSettings } from '@/components/SettingsProvider'

/**
 * Custom hook to get the company name from settings with fallback
 * @param fallback - Custom fallback name (default: 'Global Trade')
 * @returns The company name from settings or fallback
 */
export function useCompanyName(fallback: string = 'Global Trade'): string {
  const { settings } = useSettings()
  
  return settings?.companyName || fallback
}

/**
 * Custom hook to get the company name formatted for display
 * @param fallback - Custom fallback name (default: 'Global Trade')
 * @param uppercase - Whether to convert to uppercase (default: false)
 * @returns The formatted company name
 */
export function useCompanyNameFormatted(fallback: string = 'Global Trade', uppercase: boolean = false): string {
  const companyName = useCompanyName(fallback)
  
  return uppercase ? companyName.toUpperCase() : companyName
}