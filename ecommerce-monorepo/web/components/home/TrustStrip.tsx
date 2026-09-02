'use client'

import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Shield, Truck, HeadphonesIcon, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'

const trustItems = [
  { icon: Shield, labelKey: 'securePayments', subKey: 'securePaymentsSub', color: 'from-amber-500/10 to-yellow-500/10 text-amber-600' },
  { icon: Truck, labelKey: 'globalShipping', subKey: 'globalShippingSub', color: 'from-blue-500/10 to-cyan-500/10 text-blue-600' },
  { icon: HeadphonesIcon, labelKey: 'support247', subKey: 'support247Sub', color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600' },
  { icon: RotateCcw, labelKey: 'easyReturns', subKey: 'easyReturnsSub', color: 'from-purple-500/10 to-indigo-500/10 text-purple-600' },
]

export function TrustStrip() {
  const t = useTranslations('Home.trust')
  return (
    <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100/80 overflow-hidden">
      <Container maxWidth="2xl">
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.08 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 py-3.5"
        >
          {trustItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.labelKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -2, scale: 1.02 }}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white hover:shadow-sm hover:border-gray-200/60 border border-transparent transition-all duration-300 group cursor-default"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs md:text-sm font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {t(item.labelKey as any)}
                  </span>
                  <span className="text-[11px] text-gray-500 truncate hidden sm:inline">
                    {t(item.subKey as any)}
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
