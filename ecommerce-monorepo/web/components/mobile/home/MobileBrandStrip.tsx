'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { ShieldCheck, Award, CheckCircle2, Factory, Globe2 } from 'lucide-react'

interface BrandItem {
  id: string
  name: string
  badge: string
  location: string
  icon: React.ReactNode
}

interface MobileBrandStripProps {
  className?: string
}

export function MobileBrandStrip({ className = '' }: MobileBrandStripProps) {
  const locale = useLocale()

  const brands: BrandItem[] = [
    {
      id: '1',
      name: 'China Heavy Precision Co.',
      badge: 'ISO9001 / CE',
      location: 'China Industrial Zone',
      icon: <Factory className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      id: '2',
      name: 'Apex Smart Tech Corp.',
      badge: 'RoHS / FCC Verified',
      location: 'Shenzhen Hub, China',
      icon: <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    },
    {
      id: '3',
      name: 'Oriental Cookware Alliance',
      badge: 'FDA / LFGB Grade',
      location: 'Zhejiang, China',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: '4',
      name: 'Global Freight & Customs Link',
      badge: 'AEO Certified',
      location: 'Worldwide Ports',
      icon: <Globe2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    },
  ]

  return (
    <section
      data-testid="mobile-brand-strip"
      aria-label="Verified Suppliers & Partners"
      className={`py-3 px-3 ${className}`}
    >
      <div className="flex items-center gap-2 px-1 mb-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">
          {locale === 'zh'
            ? '优质认证源头工厂专区'
            : locale === 'ru'
            ? 'Проверенные фабрики и заводы'
            : 'Verified Factory Partners'}
        </h3>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
        {brands.map((b) => (
          <div
            key={b.id}
            className="shrink-0 w-[200px] p-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
              {b.icon}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                {b.name}
              </h4>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {b.badge}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                {b.location}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
