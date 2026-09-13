'use client'

import { Container } from '@/components/ui/Container'
import { ShieldCheck, Tag, Layers, RefreshCw, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'

export function TrustStrip() {
  const locale = useLocale()

  const trustContent: Record<string, Array<{
    icon: any
    title: string
    subtitle: string
    badge: string
    accent: string
  }>> = {
    en: [
      { 
        icon: Tag, 
        title: 'Factory Direct Pricing', 
        subtitle: 'No middlemen markups or hidden fees', 
        badge: 'Best Price',
        accent: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/60'
      },
      { 
        icon: ShieldCheck, 
        title: 'CE & ISO Certified', 
        subtitle: '100% inspected before export dispatch', 
        badge: 'Guaranteed',
        accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
      },
      { 
        icon: Truck, 
        title: 'Door-to-Door Freight', 
        subtitle: 'Customs cleared rail, air & sea logistics', 
        badge: 'Fast Delivery',
        accent: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
      },
      { 
        icon: RefreshCw, 
        title: 'Buyer Protection Escrow', 
        subtitle: 'Safe payment & comprehensive warranty', 
        badge: '100% Safe',
        accent: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/60'
      },
    ],
    ru: [
      { 
        icon: Tag, 
        title: 'Цены от производителей', 
        subtitle: 'Прямые поставки с фабрик без переплат', 
        badge: 'Прямой опт',
        accent: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/60'
      },
      { 
        icon: ShieldCheck, 
        title: 'Сертификация CE / EAC', 
        subtitle: 'Заводской контроль и протоколы качества', 
        badge: 'Надежно',
        accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
      },
      { 
        icon: Truck, 
        title: 'Прямая доставка карго', 
        subtitle: 'Таможенная очистка «под ключ» в СНГ', 
        badge: 'Экспресс',
        accent: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
      },
      { 
        icon: RefreshCw, 
        title: 'Безопасная сделка и гарантия', 
        subtitle: 'Полная защита оплаты и гарантийный возврат', 
        badge: '100% Защита',
        accent: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/60'
      },
    ],
    zh: [
      { 
        icon: Tag, 
        title: '源头工厂直供底价', 
        subtitle: '省去中间商赚差价 · 利润最大化', 
        badge: '出厂价',
        accent: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/60'
      },
      { 
        icon: ShieldCheck, 
        title: 'CE / ISO 9001 质量认证', 
        subtitle: '出厂前严格品控与逐台检测', 
        badge: '质检验收',
        accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
      },
      { 
        icon: Truck, 
        title: '门到门全程国际物流', 
        subtitle: '公铁联运/空海运 · 协助双清关', 
        badge: '高效发货',
        accent: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
      },
      { 
        icon: RefreshCw, 
        title: '担保交易与售后保障', 
        subtitle: '资金托管保障 · 原厂配件供应', 
        badge: '资金安全',
        accent: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/60'
      },
    ]
  }

  const items = trustContent[locale] || trustContent.en

  return (
    <div className="bg-white dark:bg-[#080E1A] border-y border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
      <Container maxWidth="2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80">
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-3.5 p-3.5 sm:p-4 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors group cursor-default"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform duration-300 group-hover:scale-105 ${item.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#0055A4] dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700 hidden sm:inline-block">
                      {item.badge}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.subtitle}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Container>
    </div>
  )
}
