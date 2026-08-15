import type { MetadataRoute } from 'next'
import { getSystemSettings, resolveCompanyName } from '@/lib/company'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSystemSettings()
  const companyName = resolveCompanyName(settings?.companyName)

  return {
    name: `${companyName} Admin Panel`,
    short_name: companyName,
    description: `Administrative panel for ${companyName} logistics services`,
    start_url: '/admin',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a3a5c',
    icons: [
      {
        src: settings?.companyFavicon || '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
