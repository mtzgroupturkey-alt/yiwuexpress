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
  const title = tagline ? `${companyName} - ${tagline}` : companyName
  return {
    title,
    description: settings?.companyDescription || title,
    icons: {
      icon: [
        { url: faviconUrl, type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ],
      shortcut: faviconUrl,
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
        { url: '/icons/apple-touch-icon-167x167.png', sizes: '167x167', type: 'image/png' },
        { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
        { url: '/icons/apple-touch-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      ],
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
  let companyName = settings?.companyName || (await getCompanyName(lang))
  if (companyName.toLowerCase() === 'dromkok') {
    companyName = 'Dromkok'
  }
  const faviconUrl = settings?.companyFavicon || '/favicon.svg'

  return (
    <html lang={lang}>
      <head>
        <link rel="icon" href={faviconUrl} />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href={faviconUrl} />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00407a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={companyName} />
        <meta name="application-name" content={companyName} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
