'use client'

import { useTranslations, useLocale } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import { Container } from '@/components/ui/Container'
import { 
  Truck, 
  ShieldCheck, 
  Warehouse, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight,
  Globe,
  Anchor,
  Clock,
  Zap
} from 'lucide-react'

export function ServicesShowcase() {
  const t = useTranslations('Services')
  const locale = useLocale()

  const coreServices = [
    {
      type: 'shipping',
      title: 'Ocean & Air Freight Logistics',
      desc: 'FCL & LCL container solutions from Ningbo, Shanghai, and Shenzhen to 180+ global seaports.',
      icon: Anchor,
      stats: '12-18 Days Express',
      badge: 'NVOCC Licensed',
      startingPrice: 'From $120 / CBM',
      href: '/services?type=shipping'
    },
    {
      type: 'customs',
      title: 'Customs & Dual-Clearance DDP',
      desc: 'Comprehensive export documentation, HS-Code verification, and tariff-free door delivery.',
      icon: ShieldCheck,
      stats: '100% Tax Compliant',
      badge: 'Zero Tariff Risk',
      startingPrice: 'All-inclusive DDP',
      href: '/services?type=customs'
    },
    {
      type: 'warehousing',
      title: 'China Warehouse Consolidation',
      desc: 'Free 15-day storage in Yiwu & Ningbo hubs. Multi-supplier consolidation and secure repacking.',
      icon: Warehouse,
      stats: '30,000+ sqm Storage',
      badge: '15 Days Free',
      startingPrice: 'Free Consolidation',
      href: '/services?type=warehousing'
    },
    {
      type: 'sourcing',
      title: 'Factory Sourcing & QC Audit',
      desc: 'Boots on the ground in Yiwu International Trade City with on-site pre-shipment quality inspection.',
      icon: Users,
      stats: '99.7% Pass Rate',
      badge: 'ISO 9001 Audited',
      startingPrice: 'Direct Factory Rates',
      href: '/services?type=sourcing'
    }
  ]

  return (
    <section className="py-16 md:py-24 bg-white border-y border-gray-100">
      <Container maxWidth="2xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 bg-primary-50 px-3.5 py-1 rounded-full border border-primary-200 inline-block">
              End-to-End Trade Solutions
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Professional China Logistics & Sourcing
            </h2>
            <p className="text-gray-600 max-w-2xl text-sm sm:text-base">
              Eliminate supply chain friction with our integrated multi-modal freight, customs brokerage, and factory consolidation network.
            </p>
          </div>

          <LocaleLink
            href="/services"
            className="inline-flex items-center text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors group shrink-0"
          >
            <span>Explore All Logistics Services</span>
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </LocaleLink>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreServices.map((srv, idx) => {
            const Icon = srv.icon
            return (
              <LocaleLink
                key={idx}
                href={srv.href}
                className="p-6 rounded-3xl bg-gray-50/70 border border-gray-200/80 shadow-sm hover:shadow-brand-lg hover:border-primary-300 hover:bg-white transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white text-primary-600 border border-gray-200/80 flex items-center justify-center shadow-sm group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-secondary-600 bg-secondary-50 border border-secondary-200 px-2.5 py-0.5 rounded-full">
                      {srv.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-3">
                      {srv.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-200/80 mt-6 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">{srv.startingPrice}</span>
                  <span className="inline-flex items-center text-xs font-bold text-primary-600 group-hover:underline">
                    Details <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </LocaleLink>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
