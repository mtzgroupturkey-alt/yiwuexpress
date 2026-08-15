import { SharedLayout } from '@/components/layout/SharedLayout'
import { LocaleLink } from '@/components/LocaleLink'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export const metadata = {
  title: 'Sitemap',
  description: 'A full index of pages across our platform.',
}

const sections = [
  {
    titleKey: 'main',
    links: [
      { nameKey: 'home', href: '/' },
      { nameKey: 'about', href: '/about' },
      { nameKey: 'services', href: '/services' },
      { nameKey: 'products', href: '/products' },
      { nameKey: 'network', href: '/network' },
    ],
  },
  {
    titleKey: 'tools',
    links: [
      { nameKey: 'costCalculator', href: '/calculator' },
      { nameKey: 'requestQuote', href: '/quotes' },
      { nameKey: 'trackShipment', href: '/track' },
      { nameKey: 'contact', href: '/contact' },
    ],
  },
  {
    titleKey: 'account',
    links: [
      { nameKey: 'login', href: '/login' },
      { nameKey: 'register', href: '/register' },
      { nameKey: 'checkout', href: '/checkout' },
      { nameKey: 'orders', href: '/orders' },
    ],
  },
  {
    titleKey: 'company',
    links: [
      { nameKey: 'blog', href: '/blog' },
      { nameKey: 'careers', href: '/careers' },
      { nameKey: 'faq', href: '/faq' },
      { nameKey: 'privacyPolicy', href: '/privacy' },
      { nameKey: 'termsOfService', href: '/terms' },
    ],
  },
]

export default function SitemapPage() {
  const t = useTranslations('Sitemap')
  return (
    <SharedLayout
      pageTitle={t('title')}
      pageDescription={t('description')}
      breadcrumbs={[{ name: t('title'), href: '/sitemap' }]}
    >
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-3">{t('subheading')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section) => (
              <div
                key={section.titleKey}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t(`${section.titleKey}.title` as any)}
                </h2>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <LocaleLink
                        href={link.href}
                        className="text-gray-600 hover:text-secondary-600 transition-colors"
                      >
                        {t(`${link.nameKey}` as any)}
                      </LocaleLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
