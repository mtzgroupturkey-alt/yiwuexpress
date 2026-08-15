import { SharedLayout } from '@/components/layout/SharedLayout'
import { Cookie, Settings, BarChart3, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

export const metadata = {
  title: 'Cookie Policy',
  description: 'How and why we use cookies on our platform.',
}

export default function CookiesPage() {
  const t = useTranslations('Legal')
  return (
    <SharedLayout
      pageTitle={t('cookies.title')}
      pageDescription={t('cookies.description')}
      breadcrumbs={[{ name: t('cookies.title'), href: '/cookies' }]}
    >
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-secondary-50 text-secondary-500 flex items-center justify-center">
                <Cookie className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('cookies.title')}</h1>
                <p className="text-sm text-gray-500">{t('lastUpdated')}</p>
              </div>
            </div>

            <div className="space-y-8 text-gray-600 leading-relaxed">
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('cookies.h1')}</h2>
                <p>{t('cookies.p1')}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('cookies.h2')}</h2>
                <p>{t('cookies.p2')}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('cookies.h3')}</h2>
                <p>{t('cookies.p3')}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('cookies.h4')}</h2>
                <p>
                  {t('cookies.p4a')}{' '}
                  <a href="mailto:privacy@yiwuexpress.com" className="text-secondary-600 hover:underline">
                    privacy@yiwuexpress.com
                  </a>
                  {t('cookies.p4b')}
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
