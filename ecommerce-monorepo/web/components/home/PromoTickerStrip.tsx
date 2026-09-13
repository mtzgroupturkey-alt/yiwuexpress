'use client'

import { useLocale } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import { Sparkles, Tag, Truck, ShieldCheck, Flame, ArrowRight } from 'lucide-react'

export function PromoTickerStrip() {
  const locale = useLocale()

  const promos: Record<string, Array<{ icon: any; title: string; subtitle: string; link: string; badge: string; color: string }>> = {
    ru: [
      {
        icon: Flame,
        title: 'Ликвидация склада до -50%',
        subtitle: 'Остатки промышленного электроинструмента',
        link: '/products?onSale=true',
        badge: 'СКИДКИ',
        color: 'from-red-600 to-rose-700'
      },
      {
        icon: Truck,
        title: 'Бесплатная сборка контейнера',
        subtitle: 'Консолидация грузов на складе в Китае',
        link: '/wholesale',
        badge: 'B2B ОПТ',
        color: 'from-[#0055A4] to-blue-700'
      },
      {
        icon: Tag,
        title: 'Рассрочка и лизинг 0%',
        subtitle: 'Для юридических лиц и предприятий',
        link: '/quotes',
        badge: '0-0-24',
        color: 'from-amber-600 to-orange-700'
      },
      {
        icon: ShieldCheck,
        title: 'Гарантия 24 месяца',
        subtitle: 'Официальный сервисный центр и запчасти',
        link: '/about',
        badge: 'НАДЕЖНО',
        color: 'from-emerald-600 to-teal-700'
      }
    ],
    en: [
      {
        icon: Flame,
        title: 'Clearance Sale Up to -50%',
        subtitle: 'Surplus industrial machinery & tools',
        link: '/products?onSale=true',
        badge: 'DEALS',
        color: 'from-red-600 to-rose-700'
      },
      {
        icon: Truck,
        title: 'Free Container Consolidation',
        subtitle: 'China factory direct hub logistics',
        link: '/wholesale',
        badge: 'WHOLESALE',
        color: 'from-[#0055A4] to-blue-700'
      },
      {
        icon: Tag,
        title: 'Tiered Bulk Pricing Available',
        subtitle: 'Lower pricing for verified B2B buyers',
        link: '/quotes',
        badge: 'VOLUME TIER',
        color: 'from-amber-600 to-orange-700'
      },
      {
        icon: ShieldCheck,
        title: '2-Year Direct Warranty',
        subtitle: 'Verified inspection reports & OEM parts',
        link: '/about',
        badge: 'CERTIFIED',
        color: 'from-emerald-600 to-teal-700'
      }
    ],
    zh: [
      {
        icon: Flame,
        title: '原厂清仓特惠 5折起',
        subtitle: '现货精密数控机床与重型电动工具',
        link: '/products?onSale=true',
        badge: '特惠清仓',
        color: 'from-red-600 to-rose-700'
      },
      {
        icon: Truck,
        title: '集装箱散货免费拼柜',
        subtitle: '国内现代化高标仓集运拼箱服务',
        link: '/wholesale',
        badge: '大宗集采',
        color: 'from-[#0055A4] to-blue-700'
      },
      {
        icon: Tag,
        title: '大宗采购阶梯返点',
        subtitle: '工厂直供 · 无中间商加价',
        link: '/quotes',
        badge: '出厂底价',
        color: 'from-amber-600 to-orange-700'
      },
      {
        icon: ShieldCheck,
        title: '出厂质检验收 2年官方质保',
        subtitle: 'CE / ISO 9001 权威出口认证保障',
        link: '/about',
        badge: '品质质保',
        color: 'from-emerald-600 to-teal-700'
      }
    ]
  }

  const items = promos[locale] || promos.en

  return (
    <section className="bg-slate-900 border-b border-slate-800 py-3 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((item, idx) => {
            const Icon = item.icon
            return (
              <LocaleLink
                key={idx}
                href={item.link}
                className="group relative flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all duration-300"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm text-white`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white truncate group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
              </LocaleLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
