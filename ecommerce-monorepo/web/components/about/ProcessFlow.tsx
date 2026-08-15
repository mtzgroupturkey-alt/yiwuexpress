'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Search, MessageSquare, ShoppingCart, Truck, CheckCircle } from 'lucide-react'

export function ProcessFlow() {
  const t = useTranslations('About')

  const steps = [
    {
      step: '1',
      title: t('process.step1Title'),
      description: t('process.step1Desc'),
      icon: Search,
      duration: '24-48 hours'
    },
    {
      step: '2', 
      title: t('process.step2Title'),
      description: t('process.step2Desc'),
      icon: MessageSquare,
      duration: '2-3 days'
    },
    {
      step: '3',
      title: t('process.step3Title'), 
      description: t('process.step3Desc'),
      icon: ShoppingCart,
      duration: '3-7 days'
    },
    {
      step: '4',
      title: t('process.step4Title'),
      description: t('process.step4Desc'),
      icon: Truck,
      duration: '12-18 days'
    },
    {
      step: '5',
      title: t('process.step5Title'),
      description: t('process.step5Desc'),
      icon: CheckCircle,
      duration: 'Ongoing'
    }
  ]

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 md:p-12 shadow-premium border border-gray-100">
      <div className="text-center mb-14">
        <span className="text-secondary-500 font-bold tracking-widest text-xs uppercase">
          {t('process.badge')}
        </span>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 mb-4">{t('process.title')}</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {t('process.subtitle')}
        </p>
      </div>

      <div className="relative">
        {/* Connecting progress line (desktop) */}
        <div className="hidden md:block absolute top-8 left-[10%] right-[10%] lg:left-[8%] lg:right-[8%] h-0.5 bg-gradient-to-r from-secondary-200 via-secondary-300 to-secondary-500" />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === steps.length - 1

            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative text-center group"
              >
                {/* Step Number & Icon */}
                <div className="relative mx-auto mb-6">
                  <div className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-secondary-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-gold group-hover:scale-110 transition-transform duration-300">
                    {step.step}
                  </div>
                  <div className="w-16 h-16 bg-white border-2 border-secondary-100 rounded-full flex items-center justify-center mx-auto shadow-sm group-hover:border-secondary-400 group-hover:bg-secondary-50 transition-all duration-300">
                    <Icon className="w-7 h-7 text-secondary-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>

                {/* Arrow (desktop) */}
                {!isLast && (
                  <div className="hidden md:block absolute top-8 -right-2 w-4 h-4">
                    <svg
                      className="w-4 h-4 text-secondary-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-secondary-600 transition-colors duration-300">{step.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{step.description}</p>
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary-600 bg-secondary-50 px-3 py-1 rounded-full border border-secondary-100">
                    <span className="w-1.5 h-1.5 bg-secondary-400 rounded-full"></span>
                    {step.duration}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Total Timeline */}
      <div className="mt-14 pt-8 border-t border-gray-100 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-50 text-primary-700">
          <CheckCircle className="w-4 h-4 text-primary-500" />
          <p className="text-sm font-medium">
            <span className="font-semibold">{t('process.totalLabel')}</span> {t('process.totalValue')}
          </p>
        </div>
      </div>
    </div>
  )
}