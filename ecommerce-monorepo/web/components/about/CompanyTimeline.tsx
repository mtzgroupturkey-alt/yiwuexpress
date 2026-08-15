'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Building, Globe, Award, TrendingUp } from 'lucide-react'

export function CompanyTimeline() {
  const t = useTranslations('About')

  const milestones = [
    {
      year: '2011',
      title: t('timeline.foundedTitle'),
      description: t('timeline.foundedDesc'),
      icon: Building,
      highlight: false
    },
    {
      year: '2015', 
      title: t('timeline.expansionTitle'),
      description: t('timeline.expansionDesc'),
      icon: Globe,
      highlight: false
    },
    {
      year: '2018',
      title: t('timeline.certificationTitle'),
      description: t('timeline.certificationDesc'),
      icon: Award,
      highlight: false
    },
    {
      year: '2024',
      title: t('timeline.innovationTitle'),
      description: t('timeline.innovationDesc'),
      icon: TrendingUp,
      highlight: true
    }
  ]

  return (
    <section className="container mx-auto px-4 py-20 max-w-5xl">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('timeline.title')}</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {t('timeline.subtitle')}
        </p>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gray-200"></div>
        
        <div className="space-y-16">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon
            const isEven = index % 2 === 0
            
            return (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`flex items-center ${isEven ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`w-5/12 ${isEven ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                  <div className={`${milestone.highlight ? 'bg-secondary-50 border-2 border-secondary-200' : 'bg-white border border-gray-200'} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300`}>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                      milestone.highlight 
                        ? 'bg-secondary-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={`text-2xl font-bold mb-2 ${
                      milestone.highlight ? 'text-secondary-500' : 'text-gray-900'
                    }`}>
                      {milestone.year}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>

                {/* Center Circle */}
                <div className={`absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full border-4 ${
                  milestone.highlight 
                    ? 'bg-secondary-500 border-secondary-200' 
                    : 'bg-white border-gray-300'
                }`}></div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}