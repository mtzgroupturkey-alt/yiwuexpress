'use client'

import { useCompanyName } from '@/hooks/useCompanyName'

interface CompanyNameProps {
  className?: string
  uppercase?: boolean
  fallback?: string
}

/**
 * Client component that renders the database-backed company name,
 * falling back to "Global Trade" (or a custom fallback) when unavailable.
 * Use inside client components that are already under <SettingsProvider>.
 */
export function CompanyName({ className, uppercase, fallback = 'Global Trade' }: CompanyNameProps) {
  const name = useCompanyName(fallback)
  return <span className={className}>{uppercase ? name.toUpperCase() : name}</span>
}
