import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Providers } from '@/components/providers'
import { SettingsProvider } from '@/components/SettingsProvider'
import { StoreSessionProvider } from '@/components/providers/StoreSessionProvider'
import { WholesaleInquiryProvider } from '@/contexts/WholesaleInquiryContext'
import { PreloaderWrapper } from '@/components/PreloaderWrapper'
import { getCompanyName, getSiteTagline, getCompanyDescription, getSystemSettings } from '@/lib/company'
import { getServerSettings } from '@/lib/settings/server-settings'
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

  return {
    title: {
      template: `%s | ${companyName}`,
      default: siteTagline
        ? `${companyName} - ${siteTagline}`
        : `${companyName} - Premium Global E-Commerce & Freight Solutions`,
    },
    description:
      companyDescription ||
      `Source wholesale products, request freight quotes, and track cargo globally from China with ${companyName}.`,
    metadataBase: new URL('https://yiwuexpress.com'),
    icons: {
      icon: companyFavicon,
      shortcut: companyFavicon,
      apple: companyFavicon,
    },
    openGraph: {
      type: 'website',
      siteName: companyName,
      title: `${companyName} - Global Trade & Logistics Platform`,
      description: `Source wholesale products, request freight quotes, and track cargo globally from China with ${companyName}.`,
      images: [
        {
          url: settings?.companyLogo || '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${companyName} Platform`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${companyName} - Global Trade & Logistics Platform`,
      description: `Source wholesale products, request freight quotes, and track cargo globally from China with ${companyName}.`,
      images: [settings?.companyLogo || '/og-image.png'],
    },
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

  const serverSettings = await getServerSettings(locale)
  const companyName = serverSettings.companyName || (await getCompanyName(locale))
  const companyLogo = serverSettings.companyLogo || null
  const companyFavicon = serverSettings.companyFavicon || '/favicon.svg'
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
          <StoreSessionProvider
            initialStoreMode={serverSettings.storeMode as any}
            initialSettings={serverSettings}
          >
            <WholesaleInquiryProvider>
              <Providers>
                <SettingsProvider initialSettings={serverSettings}>
                  {children}
                </SettingsProvider>
              </Providers>
            </WholesaleInquiryProvider>
          </StoreSessionProvider>
        </PreloaderWrapper>
      </NextIntlClientProvider>
    </>
  )
}
