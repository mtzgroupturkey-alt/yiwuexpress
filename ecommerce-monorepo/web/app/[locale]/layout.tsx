import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Providers } from '@/components/providers'
import { SettingsProvider } from '@/components/SettingsProvider'
import { StoreModeProvider } from '@/contexts/StoreModeContext'
import { SessionModeProvider } from '@/contexts/SessionModeContext'
import { WholesaleInquiryProvider } from '@/contexts/WholesaleInquiryContext'
import { PreloaderWrapper } from '@/components/PreloaderWrapper'
import { getCompanyName, getSiteTagline, getCompanyDescription, getSystemSettings } from '@/lib/company'
import { routing } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const locale = params.locale || 'en'
  const settings = await getSystemSettings(locale)
  const companyName = settings?.companyName || (await getCompanyName(locale))
  const siteTagline = await getSiteTagline(locale)
  const companyDescription = await getCompanyDescription(locale)
  const companyFavicon = settings?.companyFavicon || '/favicon.svg'

  const title = siteTagline
    ? `${companyName} | ${siteTagline}`
    : `${companyName} | Global Trade & Logistics Platform`

  const description =
    companyDescription ||
    `${companyName} - International trade and logistics platform connecting businesses worldwide from China.`

  return {
    title,
    description,
    keywords: [companyName, 'International Trade', 'Logistics', 'Shipping from China', 'B2B Sourcing', 'Customs Clearance', 'China Market'],
    authors: [{ name: companyName, url: 'https://dromkok.com' }],
    creator: companyName,
    publisher: companyName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : locale === 'ru' ? 'ru_RU' : 'en_US',
      url: 'https://dromkok.com',
      title,
      description,
      siteName: companyName,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${companyName} - Global Trade Solutions from China`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
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
      icon: companyFavicon,
      shortcut: companyFavicon,
      apple: companyFavicon,
    },
    manifest: '/manifest.json',
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const { locale } = params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const settings = await getSystemSettings(locale)
  const companyName = settings?.companyName || (await getCompanyName(locale))
  const companyLogo = settings?.companyLogo || null
  const companyFavicon = settings?.companyFavicon || '/favicon.svg'
  const messages = await getMessages()

  return (
    <>
      <link rel="icon" href={companyFavicon} />
      <link rel="shortcut icon" href={companyFavicon} />
      <link rel="apple-touch-icon" href={companyFavicon} />
      {companyLogo && (
        <link rel="preload" as="image" href={companyLogo} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": companyName,
            "url": "https://yiwuexpress.com",
            "logo": companyLogo || "https://yiwuexpress.com/logo.svg",
            "description": `${companyName} & Logistics Platform from China`,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "China",
              "addressLocality": "China",
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
      <NextIntlClientProvider messages={messages}>
        <PreloaderWrapper initialLogo={companyLogo} initialCompanyName={companyName}>
          <StoreModeProvider>
            <SessionModeProvider>
              <WholesaleInquiryProvider>
                <Providers>
                  <SettingsProvider>
                    {children}
                  </SettingsProvider>
                </Providers>
              </WholesaleInquiryProvider>
            </SessionModeProvider>
          </StoreModeProvider>
        </PreloaderWrapper>
      </NextIntlClientProvider>
    </>
  )
}
