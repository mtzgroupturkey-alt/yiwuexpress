import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { getCompanyName, getSiteTagline, getSystemSettings } from '@/lib/company'
import './globals.css'
import './preloader.css'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const [settings, companyName, tagline] = await Promise.all([
    getSystemSettings(),
    getCompanyName(),
    getSiteTagline(),
  ])
  const faviconUrl = settings?.companyFavicon || '/favicon.svg'
  const title = tagline ? `${companyName} | ${tagline}` : companyName
  return {
    title,
    description: 'International trade and logistics platform.',
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The middleware sets `x-locale` for every request (localized routes get the
  // matched locale, everything else falls back to the default). Use it to set
  // the correct <html lang> attribute for localized pages (e.g. /ru, /zh).
  const headerList = headers()
  const lang = headerList.get('x-locale') || 'en'
  const settings = await getSystemSettings(lang)
  const faviconUrl = settings?.companyFavicon || '/favicon.svg'

  return (
    <html lang={lang}>
      <head>
        <link rel="icon" href={faviconUrl} />
        <link rel="shortcut icon" href={faviconUrl} />
        <link rel="apple-touch-icon" href={faviconUrl} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
