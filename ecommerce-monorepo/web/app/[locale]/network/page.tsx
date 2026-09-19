'use client'

import React, { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { LocaleLink } from '@/components/LocaleLink'
import { useSettings } from '@/components/SettingsProvider'
import { 
  Globe, 
  Building2, 
  Ship, 
  Plane, 
  MapPin, 
  Activity, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Boxes,
  Anchor,
  CheckCircle2,
  FileText
} from 'lucide-react'

export default function NetworkPage() {
  const t = useTranslations('Network')
  const locale = useLocale()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'

  const [activeRegion, setActiveRegion] = useState('all')

  const regions = [
    { id: 'all', label: locale === 'ru' ? 'Все регионы' : locale === 'zh' ? '全网基地' : 'All Hubs' },
    { id: 'asiaPacific', label: locale === 'ru' ? 'Азиатско-Тихоокеанский регион' : locale === 'zh' ? '亚太核心口岸' : 'Asia-Pacific' },
    { id: 'european', label: locale === 'ru' ? 'Европейские коридоры' : locale === 'zh' ? '欧洲与欧亚干线' : 'European Corridors' },
    { id: 'middleEastAfrica', label: locale === 'ru' ? 'Ближний Восток и Африка' : locale === 'zh' ? '中东及北非枢纽' : 'Middle East & Africa' },
  ]

  const regionKeys = ['asiaPacific', 'european', 'middleEastAfrica']

  const filteredRegions = activeRegion === 'all' 
    ? regionKeys 
    : regionKeys.filter(r => r === activeRegion)

  return (
    <SharedLayout showHero={true}>
      <div className="bg-slate-50/70 min-h-screen">
        {/* =========================================================================
            1. HERO SECTION (Design 3 Navy Gradient & Global Stats)
           ========================================================================= */}
        <section className="relative bg-gradient-to-b from-[#0B192C] via-[#00407a] to-[#0B192C] text-white py-14 sm:py-18 overflow-hidden border-b border-slate-800">
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#F5A602_1px,transparent_1px)] [background-size:24px_24px]"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00B4D8]/10 rounded-full blur-3xl pointer-events-none"></div>

          <Container className="relative z-10">
            {/* Breadcrumb Pill */}
            <nav className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-slate-200 mb-5">
              <LocaleLink href="/" className="hover:text-white transition">
                {locale === 'ru' ? 'Главная' : locale === 'zh' ? '首页' : 'Home'}
              </LocaleLink>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-[#F5A602] font-semibold">{locale === 'ru' ? 'Логистическая сеть' : locale === 'zh' ? '全球自营网络' : 'Global Network'}</span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F5A602]/20 border border-[#F5A602]/40 text-[#F5A602] text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Собственная логистическая инфраструктура' : locale === 'zh' ? '自营集散枢纽 · 覆盖全球航线' : 'Direct Trade Corridors'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {companyName} {t('bannerTitle')}
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {t('bannerSubtitle')}
              </p>

              {/* High-Impact Global Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/15 mt-8">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold mb-1">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>{t('statHubs')}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">{t('statHubsValue')}</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold mb-1">
                    <Boxes className="w-4 h-4 text-amber-400" />
                    <span>{t('statCapacity')}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">{t('statCapacityValue')}</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold mb-1">
                    <Ship className="w-4 h-4 text-sky-400" />
                    <span>{t('statOcean')}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">{t('statOceanValue')}</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold mb-1">
                    <Plane className="w-4 h-4 text-indigo-400" />
                    <span>{t('statAir')}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">{t('statAirValue')}</div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            2. REGION FILTER STRIP
           ========================================================================= */}
        <section className="relative -mt-6 z-20">
          <Container>
            <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-xs border border-slate-200/80 flex flex-wrap items-center gap-2">
              {regions.map((reg) => {
                const isSelected = activeRegion === reg.id
                return (
                  <button
                    key={reg.id}
                    onClick={() => setActiveRegion(reg.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00407a] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <span>{reg.label}</span>
                  </button>
                )
              })}
            </div>
          </Container>
        </section>

        {/* =========================================================================
            3. REGIONAL HUBS & SHIPPING LANES
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="space-y-10">
              {filteredRegions.map((regionKey) => (
                <div 
                  key={regionKey}
                  className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs border border-slate-200/80 space-y-8"
                >
                  <div className="border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-2.5 text-[#00407a] mb-1">
                      <MapPin className="w-5 h-5" />
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {t(`${regionKey}.name` as any)}
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                      {t(`${regionKey}.description` as any)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Facilities Grid (8 cols) */}
                    <div className="lg:col-span-8 space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {t('facilitiesLabel')}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: t(`${regionKey}.hubCount` as any) as unknown as number }).map((_, hIdx) => (
                          <div 
                            key={hIdx}
                            className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#00407a]/40 hover:bg-white transition-all space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#00407a] border border-blue-100">
                                {t(`${regionKey}.hubs.${hIdx}.type` as any)}
                              </span>
                              <Building2 className="w-4 h-4 text-slate-400" />
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {t(`${regionKey}.hubs.${hIdx}.name` as any)}
                            </h4>

                            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                              <span>{t('capacityLabel')}</span>
                              <strong className="text-slate-900 font-mono">{t(`${regionKey}.hubs.${hIdx}.capacity` as any)}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trade Lanes & Departure Frequencies (4 cols) */}
                    <div className="lg:col-span-4 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#00407a] text-white space-y-4 shadow-sm border border-slate-800">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                        <Activity className="w-4 h-4" />
                        <span>{t('lanesLabel')}</span>
                      </div>

                      <ul className="space-y-3 text-xs text-slate-200 font-medium">
                        {Array.from({ length: t(`${regionKey}.modeCount` as any) as unknown as number }).map((_, mIdx) => (
                          <li key={mIdx} className="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 border border-white/10">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="leading-snug">{t(`${regionKey}.modes.${mIdx}` as any)}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-2">
                        <LocaleLink
                          href="/calculator"
                          className="w-full bg-[#F5A602] hover:bg-[#d99200] text-slate-950 font-bold py-3 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{locale === 'ru' ? 'Рассчитать доставку' : locale === 'zh' ? '核算该口岸运价' : 'Calculate Freight Route'}</span>
                        </LocaleLink>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </div>
    </SharedLayout>
  )
}
