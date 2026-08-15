import { SharedLayout } from '@/components/layout/SharedLayout'
import { FileText, Scale, RefreshCw, Ban } from 'lucide-react'
import { useTranslations } from 'next-intl'

export const metadata = {
  title: 'Terms of Service',
  description: 'The terms governing your use of our platform and services.',
}

export default function TermsPage() {
  const t = useTranslations('Legal')
  return (
    <SharedLayout
      pageTitle={t('terms.title')}
      pageDescription={t('terms.description')}
      breadcrumbs={[{ name: t('terms.title'), href: '/terms' }]}
    >
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-secondary-50 text-secondary-500 flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('terms.title')}</h1>
                <p className="text-sm text-gray-500">{t('lastUpdated')}</p>
              </div>
            </div>

            <div className="space-y-8 text-gray-600 leading-relaxed">
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.h1')}</h2>
                <p>{t('terms.p1')}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.h2')}</h2>
                <p>{t('terms.p2')}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.h3')}</h2>
                <p>{t('terms.p3')}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.h4')}</h2>
                <p>{t('terms.p4')}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.h5')}</h2>
                <p>
                  {t('terms.p5a')}{' '}
                  <a href="mailto:legal@yiwuexpress.com" className="text-secondary-600 hover:underline">
                    legal@yiwuexpress.com
                  </a>
                  {t('terms.p5b')}
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
