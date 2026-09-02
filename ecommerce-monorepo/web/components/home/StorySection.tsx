'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Building2, Users, Package, Globe } from 'lucide-react'
import { useSettings } from '@/components/SettingsProvider'

export function StorySection() {
  const t = useTranslations('About')
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'

  const highlights = [
    { icon: Building2, label: t('story.highlightLocalPresence'), value: 'Yiwu HQ' },
    { icon: Users, label: t('story.highlightTeamSize'), value: '50+ Experts' },
    { icon: Package, label: t('story.highlightDailyOrders'), value: '500+' },
    { icon: Globe, label: t('story.highlightSuccessRate'), value: '99.7%' },
  ]

  return (
    <section className="bg-gradient-primary text-white py-20 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-400/8 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/5 rounded-full filter blur-2xl pointer-events-none" />
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Image */}
        <div className="lg:col-span-5 relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[480px] border border-white/10 bg-gray-900 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80" 
                alt="Warehouse Operations" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <h3 className="text-xl font-bold text-white mb-1">{t('story.hqTitle')}</h3>
                <p className="text-gray-300 text-xs font-semibold">{t('story.hqSubtitle')}</p>
              </div>
          </div>
        </div>

        {/* Right Column: Narrative */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="inline-block">
              <span className="text-secondary-400 font-black tracking-widest text-xs uppercase bg-black/30 px-4 py-2 rounded-full border border-secondary-400/20">
                {t('story.badge', { name: companyName.toUpperCase() })}
              </span>
            </div>
             <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight font-display text-white">
                {t('story.title')}
              </h2>
            <h3 className="text-lg md:text-xl font-semibold text-secondary-200 mt-2">
               {t('story.subtitle')}
             </h3>
          </div>

          <div className="space-y-4 text-gray-300 text-sm md:text-base leading-relaxed">
            <p>
              {t('story.paragraph1')}
            </p>
            <p>
              {t('story.paragraph2')}
            </p>
          </div>

          {/* Highlight Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon
              return (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-colors duration-300">
                  <div className="bg-secondary-400/20 p-2 rounded-full text-secondary-200 mb-2 inline-flex">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-black text-white block">{highlight.value}</span>
                  <span className="text-[10px] text-gray-300 font-semibold uppercase mt-1 tracking-wider">{highlight.label}</span>
                </div>
              )
            })}
          </div>

          {/* Key Differentiator */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-secondary-400 rounded-full"></div>
              <h4 className="text-white font-semibold">{t('story.setsApartTitle')}</h4>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {t('story.setsApartBody')}
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
