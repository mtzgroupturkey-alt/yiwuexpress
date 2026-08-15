import { useTranslations } from 'next-intl'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { Globe, Building, Ship, Plane, MapPin, Activity } from 'lucide-react'

export default function NetworkPage() {
  const t = useTranslations('Network')
  const regions = [
    'asiaPacific',
    'european',
    'northAmerican',
    'middleEastAfrica',
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Banner Section */}
        <section className="bg-gradient-primary text-white py-16 relative overflow-hidden">
          <div className="absolute inset-0 chinese-pattern opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl font-bold mb-4">{t('bannerTitle')}</h1>
            <p className="text-lg text-gray-200 max-w-xl mx-auto">
              {t('bannerSubtitle')}
            </p>
          </div>
        </section>

        {/* Global Stats bar */}
        <section className="bg-white border-b border-gray-200 py-8 shadow-sm">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">{t('statHubs')}</span>
                <span className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-1.5">
                  <Building className="w-5 h-5 text-primary-500" />
                  {t('statHubsValue')}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">{t('statCapacity')}</span>
                <span className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-1.5">
                  <Globe className="w-5 h-5 text-primary-500" />
                  {t('statCapacityValue')}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">{t('statOcean')}</span>
                <span className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-1.5">
                  <Ship className="w-5 h-5 text-primary-500" />
                  {t('statOceanValue')}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">{t('statAir')}</span>
                <span className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-1.5">
                  <Plane className="w-5 h-5 text-primary-500" />
                  {t('statAirValue')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Network Hubs Grid */}
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="space-y-12">
            {regions.map((regionKey) => (
              <div key={regionKey} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-950 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-primary-600" />
                    {t(`${regionKey}.name` as any)}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">{t(`${regionKey}.description` as any)}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Hub Facilities list */}
                  <div className="lg:col-span-2 space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('facilitiesLabel')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.from({ length: t(`${regionKey}.hubCount` as any) as unknown as number }).map((_, hIdx) => (
                        <div key={hIdx} className="border border-gray-100 rounded-lg p-4 hover:border-primary-100 transition-colors">
                          <h4 className="font-bold text-gray-800 text-sm">{t(`${regionKey}.hubs.${hIdx}.name` as any)}</h4>
                          <span className="inline-block mt-2 text-xs bg-gray-50 border border-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded">
                            {t(`${regionKey}.hubs.${hIdx}.type` as any)}
                          </span>
                          <div className="mt-2 text-xs text-gray-500">
                            {t('capacityLabel')} <strong className="text-gray-700">{t(`${regionKey}.hubs.${hIdx}.capacity` as any)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Lanes list */}
                  <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-primary-600" />
                      {t('lanesLabel')}
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 font-medium">
                      {Array.from({ length: t(`${regionKey}.modeCount` as any) as unknown as number }).map((_, mIdx) => (
                        <li key={mIdx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                          {t(`${regionKey}.modes.${mIdx}` as any)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
