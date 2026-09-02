'use client'

import { Container } from '@/components/ui/Container'
import { ShieldCheck, Tag, Layers, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'

export function TrustStrip() {
  const locale = useLocale()

  const trustContent: Record<string, Array<{
    icon: any
    title: string
    subtitle: string
    color: string
  }>> = {
    en: [
      { 
        icon: Tag, 
        title: 'Factory Direct Pricing', 
        subtitle: 'No middleman markups', 
        color: 'from-amber-500/10 to-yellow-500/10 text-amber-600' 
      },
      { 
        icon: ShieldCheck, 
        title: 'Industrial Grade Certified', 
        subtitle: 'CE & ISO standard verified', 
        color: 'from-blue-500/10 to-cyan-500/10 text-blue-600' 
      },
      { 
        icon: Layers, 
        title: 'Low MOQ & Volume Tiers', 
        subtitle: 'From single units to bulk', 
        color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600' 
      },
      { 
        icon: RefreshCw, 
        title: 'Secure Escrow & Warranty', 
        subtitle: 'Full buyer protection', 
        color: 'from-purple-500/10 to-indigo-500/10 text-purple-600' 
      },
    ],
    ru: [
      { 
        icon: Tag, 
        title: 'Цены производителей', 
        subtitle: 'Прямые поставки без наценок', 
        color: 'from-amber-500/10 to-yellow-500/10 text-amber-600' 
      },
      { 
        icon: ShieldCheck, 
        title: 'Сертификация CE / EAC / ISO', 
        subtitle: 'Промышленный контроль качества', 
        color: 'from-blue-500/10 to-cyan-500/10 text-blue-600' 
      },
      { 
        icon: Layers, 
        title: 'Низкий MOQ и оптовые скидки', 
        subtitle: 'От 1 штуки до контейнеров', 
        color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600' 
      },
      { 
        icon: RefreshCw, 
        title: 'Гарантия и безопасная сделка', 
        subtitle: '100% защита покупателя', 
        color: 'from-purple-500/10 to-indigo-500/10 text-purple-600' 
      },
    ],
    zh: [
      { 
        icon: Tag, 
        title: '源头工厂直供底价', 
        subtitle: '去除中间环节 · 价格透明', 
        color: 'from-amber-500/10 to-yellow-500/10 text-amber-600' 
      },
      { 
        icon: ShieldCheck, 
        title: '工业级出厂质量认证', 
        subtitle: '全系通过 CE 与 ISO 9001 认证', 
        color: 'from-blue-500/10 to-cyan-500/10 text-blue-600' 
      },
      { 
        icon: Layers, 
        title: '灵活起订与阶梯批发', 
        subtitle: '支持单台试单与集装箱整柜', 
        color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600' 
      },
      { 
        icon: RefreshCw, 
        title: '官方质保与资金安全保障', 
        subtitle: '全程采购履约与售后保障', 
        color: 'from-purple-500/10 to-indigo-500/10 text-purple-600' 
      },
    ]
  }

  const items = trustContent[locale] || trustContent.en

  return (
    <div className="bg-white dark:bg-[#0a1628] border-b border-gray-200/80 dark:border-white/10 shadow-xs overflow-hidden">
      <Container maxWidth="2xl">
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.08 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 py-4"
        >
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -2 }}
                className="flex items-center gap-3 px-3.5 py-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200/60 dark:hover:border-white/10 transition-all duration-300 group cursor-default"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-gray-100 dark:border-white/10`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-[#c9a84c] transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {item.subtitle}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </Container>
    </div>
  )
}
