import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { SettingsProvider } from '@/components/SettingsProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YIWU EXPRESS | Global Trade & Logistics Platform',
  description: 'YIWU EXPRESS - International trade and logistics platform connecting businesses worldwide from Yiwu, China. Professional shipping, customs clearance, warehousing, and sourcing services.',
  keywords: ['YIWU EXPRESS', 'International Trade', 'Logistics', 'Shipping from China', 'B2B Sourcing', 'Customs Clearance', 'Yiwu Market'],
  authors: [{ name: 'YIWU EXPRESS', url: 'https://yiwuexpress.com' }],
  creator: 'YIWU EXPRESS',
  publisher: 'YIWU EXPRESS',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yiwuexpress.com',
    title: 'YIWU EXPRESS | Global Trade & Logistics Platform',
    description: 'Connect with global markets through YIWU EXPRESS. Professional logistics, customs clearance, and trade services from Yiwu, China.',
    siteName: 'YIWU EXPRESS',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'YIWU EXPRESS - Global Trade Solutions from Yiwu, China',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YIWU EXPRESS | Global Trade & Logistics Platform',
    description: 'Connect with global markets through YIWU EXPRESS. Professional logistics, customs clearance, and trade services from Yiwu, China.',
    images: ['/og-image.png'],
    creator: '@yiwuexpress',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "YIWU EXPRESS",
              "url": "https://yiwuexpress.com",
              "logo": "https://yiwuexpress.com/logo.svg",
              "description": "Global Trade & Logistics Platform from Yiwu, China",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Yiwu International Trade City",
                "addressLocality": "Yiwu",
                "addressRegion": "Zhejiang",
                "addressCountry": "CN"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+86-579-8555-1234",
                "contactType": "customer service",
                "areaServed": "Worldwide",
                "availableLanguage": ["en", "zh"]
              },
              "sameAs": [
                "https://twitter.com/yiwuexpress",
                "https://linkedin.com/company/yiwuexpress",
                "https://facebook.com/yiwuexpress"
              ]
            })
          }}
        />
        <script src="/unregister-sw.js" defer></script>
      </head>
      <body className={inter.className}>
        <Providers>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </Providers>
      </body>
    </html>
  )
}