import { useTranslations } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { LocaleLink } from '@/components/LocaleLink'
import { Briefcase, MapPin, Users, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Careers',
  description: 'Join our team building the bridge between China manufacturing and global businesses.',
}

const roles = [
  'sourcingSpecialist',
  'qualityInspectionLead',
  'logisticsCoordinator',
  'businessDevelopmentManager',
]

export default function CareersPage() {
  const t = useTranslations('Careers')
  return (
    <SharedLayout
      pageTitle={t('pageTitle')}
      pageDescription={t('pageDescription')}
      breadcrumbs={[{ name: t('breadcrumb'), href: '/careers' }]}
    >
      <div className="bg-gradient-primary text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('heroTitle')}</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            {t('heroBody')}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((roleKey) => (
              <div
                key={roleKey}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{t(`${roleKey}.title` as any)}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {t(`${roleKey}.location` as any)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {t(`${roleKey}.type` as any)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{t(`${roleKey}.description` as any)}</p>
                <LocaleLink href="/contact"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-secondary-500 hover:text-secondary-600 transition-colors"
                >
                  {t('applyNow')}
                  <ArrowRight className="w-4 h-4" />
                </LocaleLink>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
