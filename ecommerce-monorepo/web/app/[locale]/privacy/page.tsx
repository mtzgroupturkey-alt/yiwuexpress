import { SharedLayout } from '@/components/layout/SharedLayout'
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'

export const metadata = {
  title: 'Privacy Policy',
  description: 'How we collect, use, and protect your information.',
}

export default function PrivacyPage() {
  const t = useTranslations('Legal')
  return (
    <SharedLayout
      pageTitle={t('privacy.title')}
      pageDescription={t('privacy.description')}
      breadcrumbs={[{ name: t('privacy.title'), href: '/privacy' }]}
    >
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-secondary-50 text-secondary-500 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('privacy.title')}</h1>
                <p className="text-sm text-gray-500">{t('lastUpdated')}</p>
              </div>
            </div>

            <div className="space-y-8 text-gray-600 leading-relaxed">
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.h1')}</h2>
                <p>{t('privacy.p1')}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.h2')}</h2>
                <p>{t('privacy.p2')}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.h3')}</h2>
                <p>{t('privacy.p3')}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.h4')}</h2>
                <p>{t('privacy.p4')}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('privacy.h5')}</h2>
                <p>
                  {t('privacy.p5a')}{' '}
                  <a href="mailto:privacy@yiwuexpress.com" className="text-secondary-600 hover:underline">
                    privacy@yiwuexpress.com
                  </a>
                  {t('privacy.p5b')}
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
