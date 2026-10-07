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
        { url: faviconUrl, type: faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png' },
        { url: faviconUrl, sizes: '32x32', type: faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png' },
        { url: faviconUrl, sizes: '16x16', type: faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png' },
      ],
      shortcut: faviconUrl,
      apple: [
        { url: faviconUrl, sizes: '180x180', type: faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png' },
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
        <link rel="icon" type="image/png" sizes="32x32" href={faviconUrl} />
        <link rel="icon" type="image/png" sizes="16x16" href={faviconUrl} />
        <link rel="shortcut icon" href={faviconUrl} />
        <link rel="apple-touch-icon" sizes="180x180" href={faviconUrl} />
        <link rel="apple-touch-icon" href={faviconUrl} />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href={faviconUrl} />
        <link rel="apple-touch-icon-precomposed" href={faviconUrl} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00407a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={companyName} />
        <meta name="application-name" content={companyName} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              function handleChunkError(msg) {
                if (typeof msg !== 'string') return;
                var isStale = msg.indexOf('Loading chunk') !== -1 ||
                              msg.indexOf('ChunkLoadError') !== -1 ||
                              msg.indexOf('Refused to execute script') !== -1 ||
                              msg.indexOf('Refused to apply style') !== -1 ||
                              msg.indexOf('not a supported stylesheet MIME type') !== -1;
                if (isStale) {
                  var k = '_chunk_reload_retry';
                  var now = Date.now();
                  var last = parseInt(sessionStorage.getItem(k) || '0', 10);
                  if (now - last > 8000) {
                    sessionStorage.setItem(k, now);
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function(regs) {
                        regs.forEach(function(r) { r.unregister(); });
                      }).finally(function() {
                        window.location.reload();
                      });
                    } else {
                      window.location.reload();
                    }
                  }
                }
              }
              window.addEventListener('error', function(e) {
                var msg = (e && e.message) || (e && e.target && e.target.src) || (e && e.target && e.target.href) || '';
                handleChunkError(msg);
              }, true);
              window.addEventListener('unhandledrejection', function(e) {
                if (e && e.reason) {
                  var reason = e.reason;
                  var msg = reason.message || (typeof reason === 'string' ? reason : '');
                  handleChunkError(msg);
                }
              });
            })();`,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
