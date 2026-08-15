import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import './preloader.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YIWU EXPRESS',
  description: 'International trade and logistics platform.',
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
  const headerList = await headers()
  const lang = headerList.get('x-locale') || 'en'

  return (
    <html lang={lang}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
