'use client'

import React, { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import { useQuery } from '@tanstack/react-query'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Container } from '@/components/ui/Container'
import { useSettings } from '@/components/SettingsProvider'
import ServiceCard from '@/components/service-card'
import { Service } from '@prisma/client'
import { 
  Search, 
  Filter, 
  Truck, 
  Shield, 
  Package, 
  Users, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Calculator, 
  Clock, 
  Building2, 
  Globe2,
  ArrowRight
} from 'lucide-react'

interface ServiceResponse {
  services: Service[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ServicesPage() {
  const t = useTranslations('Services')
  const locale = useLocale()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'

  const [page, setPage] = useState(1)
  const [serviceType, setServiceType] = useState<string>('')
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useQuery<ServiceResponse>({
    queryKey: ['services', page, serviceType, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(serviceType && { type: serviceType }),
        ...(search && { search }),
      })
      const response = await fetch(`/api/services?${params}&locale=${locale}`)
      if (!response.ok) throw new Error('Failed to fetch services')
      return response.json()
    },
  })

  const serviceTypes = [
    { value: '', label: t('filter.all'), icon: Filter },
    { value: 'shipping', label: t('filter.shipping'), icon: Truck },
    { value: 'customs', label: t('filter.customs'), icon: Shield },
    { value: 'warehousing', label: t('filter.warehousing'), icon: Package },
    { value: 'sourcing', label: t('filter.sourcing'), icon: Users },
  ]

  return (
    <SharedLayout showHero={true}>
      <div className="bg-slate-50/70 min-h-screen">
        {/* =========================================================================
            1. HERO SECTION (Design 3 Navy Gradient & Trust Badges)
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
              <span className="text-[#F5A602] font-semibold">{t('breadcrumb')}</span>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F5A602]/20 border border-[#F5A602]/40 text-[#F5A602] text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{locale === 'ru' ? 'Комплексные B2B услуги в Китае' : locale === 'zh' ? '全链路跨境采购与供应链' : 'China B2B Trade & Logistics Solutions'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
                {companyName} {t('pageTitle')}
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {t('pageDescription')}
              </p>

              {/* Trust Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/15 mt-8">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Factory Audits</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>100% Escrow</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span>FCL / LCL Freight</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span>Rapid Dispatch</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            2. FLOATING SEARCH & FILTER BAR
           ========================================================================= */}
        <section className="relative -mt-6 z-20">
          <Container>
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Search Bar */}
                <div className="md:col-span-8 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-sm text-slate-800 transition"
                  />
                </div>

                {/* Calculator Shortcut */}
                <div className="md:col-span-4 flex justify-end">
                  <LocaleLink
                    href="/calculator"
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#00407a] hover:bg-[#003366] text-white font-bold rounded-2xl shadow-xs transition text-xs"
                  >
                    <Calculator className="w-4 h-4 text-amber-300" />
                    <span>{t('calculatorShortcut')}</span>
                  </LocaleLink>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                {serviceTypes.map((type) => {
                  const Icon = type.icon
                  const isActive = serviceType === type.value
                  return (
                    <button
                      key={type.value}
                      onClick={() => { setServiceType(type.value); setPage(1); }}
                      className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#00407a] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{type.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Container>
        </section>

        {/* =========================================================================
            3. SERVICES GRID & PAGINATION
           ========================================================================= */}
        <section className="py-12 sm:py-16">
          <Container>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs animate-pulse space-y-3">
                    <div className="bg-slate-200 h-48 rounded-2xl"></div>
                    <div className="bg-slate-200 h-5 rounded w-3/4"></div>
                    <div className="bg-slate-200 h-4 rounded w-1/2"></div>
                    <div className="bg-slate-200 h-10 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 text-rose-600 font-bold bg-white rounded-3xl p-8 border border-rose-100">
                {t('errorLoading')}: {(error as Error).message}
              </div>
            ) : data?.services && data.services.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>

                {/* Pagination */}
                {data.pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                    >
                      {t('pagination.previous')}
                    </button>
                    <span className="text-slate-600 text-xs font-semibold px-3">
                      {t('pagination.pageOf', { page: page.toString(), pages: data.pagination.pages.toString() })}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, data.pagination.pages))}
                      disabled={page === data.pagination.pages}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                    >
                      {t('pagination.next')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl shadow-xs border border-slate-200/80 p-8 max-w-md mx-auto">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 text-base font-bold">{t('noResults')}</p>
                <button
                  onClick={() => { setServiceType(''); setSearch(''); }}
                  className="mt-4 px-5 py-2.5 bg-[#00407a] text-white text-xs font-bold rounded-xl hover:bg-[#003366] transition cursor-pointer"
                >
                  {t('clearFilters')}
                </button>
              </div>
            )}
          </Container>
        </section>
      </div>
    </SharedLayout>
  )
}
