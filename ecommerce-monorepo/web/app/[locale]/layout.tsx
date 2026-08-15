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
import { getCompanyName } from '@/lib/company'
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
  const companyName = await getCompanyName()
  const description = `${companyName} - International trade and logistics platform connecting businesses worldwide from China. Professional shipping, customs clearance, warehousing, and sourcing services.`
  return {
    title: `${companyName} | Global Trade & Logistics Platform`,
    description,
    keywords: [companyName, 'International Trade', 'Logistics', 'Shipping from China', 'B2B Sourcing', 'Customs Clearance', 'China Market'],
    authors: [{ name: companyName, url: 'https://yiwuexpress.com' }],
    creator: companyName,
    publisher: companyName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: params.locale === 'zh' ? 'zh_CN' : params.locale === 'ru' ? 'ru_RU' : 'en_US',
      url: 'https://yiwuexpress.com',
      title: `${companyName} | Global Trade & Logistics Platform`,
      description: `Connect with global markets through ${companyName}. Professional logistics, customs clearance, and trade services from China.`,
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
      title: `${companyName} | Global Trade & Logistics Platform`,
      description: `Connect with global markets through ${companyName}. Professional logistics, customs clearance, and trade services from China.`,
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
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
      apple: '/favicon.svg',
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

  const companyName = await getCompanyName()
  const messages = await getMessages()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": companyName,
            "url": "https://yiwuexpress.com",
            "logo": "https://yiwuexpress.com/logo.svg",
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
        <PreloaderWrapper>
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
