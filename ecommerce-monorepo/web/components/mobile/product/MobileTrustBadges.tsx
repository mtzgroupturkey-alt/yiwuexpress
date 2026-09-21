'use client'

import React from 'react'
import { ShieldCheck, Truck, Factory, Award } from 'lucide-react'
import { useLocale } from 'next-intl'

interface MobileTrustBadgesProps {
  className?: string
}

export function MobileTrustBadges({ className = '' }: MobileTrustBadgesProps) {
  const locale = useLocale()

  const badges = [
    {
      icon: <Factory className="w-4 h-4 text-primary-600 dark:text-primary-400" />,
      title: locale === 'zh' ? '源头工厂直供' : locale === 'ru' ? 'Прямой производитель' : 'Direct Verified Factory',
      desc: locale === 'zh' ? '无中间商一手出厂底价' : locale === 'ru' ? 'Без наценок посредников' : 'Zero middleman markup',
    },
    {
      icon: <Award className="w-4 h-4 text-amber-500" />,
      title: locale === 'zh' ? '专业验厂与品控' : locale === 'ru' ? 'Контроль качества' : 'Rigorous Quality Inspection',
      desc: locale === 'zh' ? '出货前实物检测把关' : locale === 'ru' ? 'Проверка перед отправкой' : 'Pre-shipment inspection',
    },
    {
      icon: <Truck className="w-4 h-4 text-blue-500" />,
      title: locale === 'zh' ? '双清包税物流专线' : locale === 'ru' ? 'Таможенная очистка' : 'Door-to-Door Logistics',
      desc: locale === 'zh' ? '海运空运拼箱极速清关' : locale === 'ru' ? 'Авиа и морская доставка' : 'Air & ocean freight cleared',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
      title: locale === 'zh' ? '贸易资金担保' : locale === 'ru' ? 'Безопасная сделка' : 'Trade Assurance Protected',
      desc: locale === 'zh' ? '验货通过后支付尾款' : locale === 'ru' ? 'Гарантия сохранности средств' : 'Escrow payment security',
    },
  ]

  return (
    <div
      data-testid="mobile-trust-badges"
      className={`rounded-3xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/80 p-4 space-y-3 ${className}`}
    >
      <div className="grid grid-cols-2 gap-3">
        {badges.map((b, idx) => (
          <div key={idx} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
              {b.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                {b.title}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 leading-tight">
                {b.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
