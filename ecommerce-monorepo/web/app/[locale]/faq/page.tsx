import { useTranslations } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { HelpCircle, Truck, ShieldCheck, MessageSquare, Eye } from 'lucide-react'

export const metadata = {
  title: 'FAQ',
  description: 'Answers to common questions about sourcing, shipping, and our services.',
}

const faqKeys = [
  'sourcingDelivery',
  'qualityInspection',
  'shippingRoutes',
  'pricing',
  'trackOrder',
  'smallBusiness',
]

export default function FaqPage() {
  const t = useTranslations('Faq')
  const icons = [Truck, ShieldCheck, MessageSquare, Truck, Eye, HelpCircle].map((I, i) => I)

  return (
    <SharedLayout
      pageTitle={t('pageTitle')}
      pageDescription={t('pageDescription')}
      breadcrumbs={[{ name: t('breadcrumb'), href: '/faq' }]}
    >
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('pageTitle')}</h1>
            <p className="text-gray-600 mt-3">{t('intro')}</p>
          </div>

          <div className="space-y-4">
            {faqKeys.map((key, idx) => {
              const Icon = icons[idx % icons.length]
              return (
                <div
                  key={key}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-4"
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-secondary-50 text-secondary-500 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{t(`${key}.q` as any)}</h3>
                    <p className="text-gray-600 leading-relaxed">{t(`${key}.a` as any)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
