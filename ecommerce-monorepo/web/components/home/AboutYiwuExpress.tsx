'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import Link from 'next/link'
import { 
  Award, 
  Globe, 
  Users, 
  ShoppingBag, 
  CheckCircle2, 
  TrendingUp,
  Shield,
  Clock,
  Truck,
  BadgeCheck
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSettings } from '@/components/SettingsProvider'

export function AboutYiwuExpress() {
  const t = useTranslations('Home.about')
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const { settings } = useSettings()
  
  // Get company name from settings, fallback to 'Global Trade'
  const companyName = settings?.companyName || 'Global Trade'

  const statistics = [
    { icon: Award, value: 15, suffix: '+', labelKey: 'stats.years', color: '#1a3a5c' },
    { icon: Users, value: 1500, suffix: '+', labelKey: 'stats.clients', color: '#c9a84c' },
    { icon: Globe, value: 50, suffix: '+', labelKey: 'stats.countries', color: '#1a3a5c' },
    { icon: ShoppingBag, value: 10000, suffix: '+', labelKey: 'stats.products', color: '#c9a84c' }
  ]

  const features = [
    {
      icon: ShoppingBag,
      titleKey: 'features.directTitle',
      descriptionKey: 'features.directDesc'
    },
    {
      icon: Truck,
      titleKey: 'features.fastTitle',
      descriptionKey: 'features.fastDesc'
    },
    {
      icon: Shield,
      titleKey: 'features.qualityTitle',
      descriptionKey: 'features.qualityDesc'
    },
    {
      icon: TrendingUp,
      titleKey: 'features.pricesTitle',
      descriptionKey: 'features.pricesDesc'
    }
  ]

  const process = [
    { step: '01', titleKey: 'process.request', descriptionKey: 'process.requestDesc' },
    { step: '02', titleKey: 'process.source', descriptionKey: 'process.sourceDesc' },
    { step: '03', titleKey: 'process.check', descriptionKey: 'process.checkDesc' },
    { step: '04', titleKey: 'process.ship', descriptionKey: 'process.shipDesc' }
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  return (
    <section 
      ref={sectionRef}
      id="about" 
      className="relative bg-gradient-to-br from-gray-50 to-white py-16 md:py-24 overflow-hidden"
    >
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#1a3a5c]/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c9a84c]/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <span className="inline-flex items-center gap-2 bg-[#1a3a5c] border-2 border-[#c9a84c] px-8 py-3 rounded-full text-sm md:text-base font-black uppercase tracking-widest shadow-xl">
            <span className="text-white">{t('badge')}</span>
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-6"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a3a5c] tracking-tight mb-4">
            {t('headline1')}
            <span className="text-[#c9a84c]">
              {t('headline2')}
            </span>
            {t('headline3')}
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16">
          
          {/* Image Column */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#1a3a5c] to-[#c9a84c] rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-1000" />
              
              {/* Main Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80" 
                  alt="China International Trade Market" 
                  className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                {/* Experience Badge Overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-[#1a3a5c]">15+</p>
                         <p className="text-sm text-gray-600 font-semibold">{t('yearsBadge')}</p>
                      </div>
                      <div className="bg-gradient-to-br from-[#1a3a5c] to-[#c9a84c] p-3 rounded-xl">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Column */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-7"
          >
            <div className="space-y-6">
              
              {/* Description */}
              <div className="space-y-4 text-gray-700 text-base md:text-lg leading-relaxed">
                <p>
                  <strong className="text-[#1a3a5c]">{companyName}</strong>{t('desc1a')}
                  <strong className="text-[#1a3a5c]">{t('yearsExperience')}</strong>{t('desc1b')}
                </p>
                <p>
                  {t('desc2a')}<strong>{t('productResearch')}</strong>{t('desc2b')}<strong>{t('qualityInspection')}</strong>{t('desc2c')}
                  <strong>{t('warehousing')}</strong>{t('desc2d')}<strong>{t('internationalShipping')}</strong>{t('desc2e')}
                  <span className="text-[#1a3a5c] font-semibold">{t('competitivePrices')}</span>{t('desc2f')}
                  <span className="text-[#1a3a5c] font-semibold">{t('rigorousQualityControl')}</span>{t('desc2g')}
                  <span className="text-[#1a3a5c] font-semibold">{t('timelyDelivery')}</span>{t('desc2h')}
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-3">
                {[
                  'direct',
                  'quality',
                  'prices',
                  'logistics',
                  'support',
                  'moq'
                ].map((key, index) => (
                  <motion.div 
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isVisible ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 + (index * 0.05) }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6 text-[#c9a84c] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">{t(`featureList.${key}` as any)}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <LocaleLink 
                  href="/about"
                  className="bg-gradient-to-r from-[#1a3a5c] to-[#0d2a4a] text-white px-8 py-4 rounded-xl font-bold text-base hover:shadow-xl hover:-translate-y-1 transition-all duration-300 inline-flex items-center gap-2"
                >
                  {t('learnMore')}
                  <span className="text-lg">→</span>
                </LocaleLink>
                <LocaleLink 
                  href="/contact"
                  className="bg-white border-2 border-[#1a3a5c] text-[#1a3a5c] px-8 py-4 rounded-xl font-bold text-base hover:bg-[#1a3a5c] hover:text-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {t('getQuote')}
                </LocaleLink>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Statistics Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16"
        >
          {statistics.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div className="flex flex-col items-center text-center">
                  <div 
                    className="p-4 rounded-2xl mb-4"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="w-8 h-8" style={{ color: stat.color }} />
                  </div>
                  <CountUpAnimation 
                    end={stat.value} 
                    suffix={stat.suffix}
                    isVisible={isVisible}
                    className="text-4xl md:text-5xl font-bold mb-2"
                    style={{ color: stat.color }}
                  />
                  <span className="text-sm text-gray-600 font-semibold uppercase tracking-wide">
                    {t(stat.labelKey as any)}
                  </span>
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-16"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-center text-[#1a3a5c] mb-10">
            {t('whyTitle')}{companyName}?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.7 + (index * 0.1) }}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 group"
                >
                  <div className="bg-[#1a3a5c] p-4 rounded-2xl w-fit mb-4 group-hover:bg-[#c9a84c] transition-colors duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-[#1a3a5c] mb-2">{t(feature.titleKey as any)}</h4>
                  <p className="text-gray-600 leading-relaxed">{t(feature.descriptionKey as any)}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Process Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-16"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-center text-[#1a3a5c] mb-10">
            {t('howTitle')}
          </h3>
          <div className="grid md:grid-cols-4 gap-4 md:gap-6">
            {process.map((item, index) => (
              <div key={index} className="relative">
                {/* Connector Line (desktop only) */}
                {index < process.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-full h-1 bg-[#c9a84c] opacity-30" />
                )}
                
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 relative z-10">
                  <div className="bg-[#1a3a5c] text-white text-3xl font-black w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-bold text-[#1a3a5c] mb-2">{t(item.titleKey as any)}</h4>
                   <p className="text-gray-600">{t(item.descriptionKey as any)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="bg-gradient-to-br from-[#1a3a5c] via-[#1a3a5c] to-[#0d2a4a] rounded-3xl p-8 md:p-12 text-center shadow-2xl border border-[#c9a84c]/20"
        >
          <BadgeCheck className="w-20 h-20 text-[#c9a84c] mx-auto mb-6 drop-shadow-2xl" />
          <h3 className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight">
            {t('trustTitle')}
          </h3>
          <p className="text-white text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
            {t('trustDesc1')}<span className="text-[#c9a84c] font-bold">50+ countries</span>{t('trustDesc2')}{companyName}{t('trustDesc3')}
          </p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            <div className="flex flex-col md:flex-row items-center gap-3 bg-white/5 backdrop-blur-sm px-6 py-4 rounded-xl hover:bg-white/10 transition-all duration-300">
              <div className="bg-[#c9a84c] p-3 rounded-xl shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <span className="text-white font-bold text-lg">{t('support247')}</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3 bg-white/5 backdrop-blur-sm px-6 py-4 rounded-xl hover:bg-white/10 transition-all duration-300">
              <div className="bg-[#c9a84c] p-3 rounded-xl shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <span className="text-white font-bold text-lg">{t('securePayments')}</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3 bg-white/5 backdrop-blur-sm px-6 py-4 rounded-xl hover:bg-white/10 transition-all duration-300">
              <div className="bg-[#c9a84c] p-3 rounded-xl shadow-lg">
                <BadgeCheck className="w-7 h-7 text-white" />
              </div>
              <span className="text-white font-bold text-lg">{t('verified')}</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}

// Counter Animation Component
function CountUpAnimation({ 
  end, 
  suffix = '', 
  isVisible, 
  className = '', 
  style = {} 
}: { 
  end: number
  suffix?: string
  isVisible: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    let startTime: number | null = null
    const duration = 2000 // 2 seconds
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      setCount(Math.floor(progress * end))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [end, isVisible])

  return (
    <span className={className} style={style}>
      {count.toLocaleString()}{suffix}
    </span>
  )
}
