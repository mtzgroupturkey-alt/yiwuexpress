import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { Providers } from '@/components/providers'
import { SettingsProvider } from '@/components/SettingsProvider'
import { StoreSessionProvider } from '@/components/providers/StoreSessionProvider'
import { SessionModeProvider } from '@/contexts/SessionModeContext'
import { WholesaleInquiryProvider } from '@/contexts/WholesaleInquiryContext'
import { PreloaderWrapper } from '@/components/PreloaderWrapper'
import { getCompanyName, getSiteTagline, getCompanyDescription, getSystemSettings } from '@/lib/company'
import { getServerSettings } from '@/lib/settings/server-settings'
import { routing } from '@/i18n/routing'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { BackToTop } from '@/components/ui/BackToTop'
import { isMobile as checkIsMobile, isIOS as checkIsIOS, isAndroid as checkIsAndroid } from '@/lib/device'
import { MobileProvider } from '@/components/MobileProvider'
import { BottomNav } from '@/components/mobile/BottomNav'
import { InstallPrompt } from '@/components/mobile/InstallPrompt'
import { LocaleCurrencyAutoDetect } from '@/components/i18n/LocaleCurrencyAutoDetect'

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
    metadataBase: new URL('https://dromkok.com'),
    manifest: '/manifest.json',
    icons: {
      icon: companyFavicon,
      shortcut: companyFavicon,
      apple: '/icons/apple-touch-icon.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: companyName || 'Global Trade',
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
  themeColor: '#00407a',
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

  const cookieStore = cookies()
  const rawSessionCookie = cookieStore.get('store_session_mode')?.value
  const rawCurrencyCookie = cookieStore.get('NEXT_CURRENCY')?.value

  let resolvedSessionMode: 'wholesale' | 'retail' = 'wholesale'
  if (serverSettings.storeMode === 'WHOLESALE') {
    resolvedSessionMode = 'wholesale'
  } else if (serverSettings.storeMode === 'RETAIL') {
    resolvedSessionMode = 'retail'
  } else if (rawSessionCookie === 'wholesale' || rawSessionCookie === 'retail') {
    resolvedSessionMode = rawSessionCookie
  } else {
    resolvedSessionMode = 'retail'
  }

  const headerList = headers()
  const userAgent = headerList.get('user-agent') || ''
  const initialIsMobile = checkIsMobile(userAgent)
  const initialIsIOS = checkIsIOS(userAgent)
  const initialIsAndroid = checkIsAndroid(userAgent)

  return (
    <>
      <link rel="icon" href={companyFavicon} />
      <link rel="shortcut icon" href={companyFavicon} />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#00407a" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={companyName || 'GlobalTrade'} />
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
            "url": "https://dromkok.com",
            "logo": companyLogo || "https://dromkok.com/logo.svg",
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
      <NextIntlClientProvider messages={messages}>
        <PreloaderWrapper initialLogo={companyLogo} initialCompanyName={companyName}>
          <StoreSessionProvider
            initialStoreMode={serverSettings.storeMode as any}
            initialSessionMode={resolvedSessionMode}
            initialSettings={serverSettings}
          >
            <SessionModeProvider initialMode={resolvedSessionMode}>
              <WholesaleInquiryProvider>
                <Providers>
                  <SettingsProvider initialSettings={serverSettings}>
                    <CurrencyProvider initialCurrency={rawCurrencyCookie}>
                      <LocaleCurrencyAutoDetect />
                      <MobileProvider
                        initialIsMobile={initialIsMobile}
                        initialIsIOS={initialIsIOS}
                        initialIsAndroid={initialIsAndroid}
                      >
                        <main className="pb-20 md:pb-0 min-h-screen">
                          {children}
                        </main>
                        <InstallPrompt />
                        <BottomNav />
                        <BackToTop />
                      </MobileProvider>
                    </CurrencyProvider>
                  </SettingsProvider>
                </Providers>
              </WholesaleInquiryProvider>
            </SessionModeProvider>
          </StoreSessionProvider>
        </PreloaderWrapper>
      </NextIntlClientProvider>
    </>
  )
}
