'use client'

import { useState, useEffect, useRef } from 'react'
import { LocaleLink } from '@/components/LocaleLink'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  Layers, 
  Zap,
  TrendingUp,
  PackageCheck,
  Building2,
  CheckCircle2
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useSettings } from '@/components/SettingsProvider'
import { useLocale } from 'next-intl'

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  imageUrl: string
  mobileImageUrl: string | null
  productImageUrl: string | null
  badgeText: string | null
  badgeColor: string | null
  ctaText: string
  ctaLink: string
  secondaryCtaText: string | null
  secondaryCtaLink: string | null
  overlayColor: string | null
  textColor: string | null
  displayOrder: number
  isActive: boolean
  slideDuration: number
  alignment: 'left' | 'center' | 'right'
  motionType: string
}

const DEFAULT_CINEMATIC_SLIDES: HeroSlide[] = [
  {
    id: 'slide-machinery',
    title: 'Industrial Machinery & Precision Engineering',
    subtitle: 'FACTORY-DIRECT B2B WHOLESALE & RETAIL',
    description: 'Direct procurement from Tier-1 Chinese manufacturers. High-precision CNC centers, hydraulic presses, automation machinery, and industrial production lines with full CE & ISO certification.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=85',
    mobileImageUrl: null,
    productImageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    badgeText: 'PREMIUM INDUSTRIAL SELECTION',
    badgeColor: '#c9a84c',
    ctaText: 'Explore Machinery Catalog',
    ctaLink: '/products?category=machinery',
    secondaryCtaText: 'Request Wholesale RFQ',
    secondaryCtaLink: '/wholesale',
    overlayColor: 'rgba(10, 22, 40, 0.75)',
    textColor: '#ffffff',
    displayOrder: 1,
    isActive: true,
    slideDuration: 6,
    alignment: 'left',
    motionType: 'fade'
  },
  {
    id: 'slide-tools',
    title: 'Heavy-Duty Power Tools & Workshop Hardware',
    subtitle: 'ENGINEERED FOR EXTREME DURABILITY',
    description: 'Equip your workshop with professional brushless cordless tools, pneumatic equipment, precision measuring systems, and industrial hardware backed by manufacturer warranties.',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1920&q=85',
    mobileImageUrl: null,
    productImageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80',
    badgeText: 'PRO TOOLS & EQUIPMENT',
    badgeColor: '#c9a84c',
    ctaText: 'Shop Power Tools',
    ctaLink: '/products?category=tools',
    secondaryCtaText: 'Download Wholesale List',
    secondaryCtaLink: '/wholesale',
    overlayColor: 'rgba(10, 22, 40, 0.75)',
    textColor: '#ffffff',
    displayOrder: 2,
    isActive: true,
    slideDuration: 6,
    alignment: 'left',
    motionType: 'slide'
  },
  {
    id: 'slide-wholesale',
    title: 'Volume Tier Pricing & Direct Factory Supply',
    subtitle: 'CUSTOM OEM/ODM & CONTAINER LOADS',
    description: 'Save up to 45% with tiered wholesale discounts. Low MOQs for trial orders, dedicated quality inspection on site in China, and seamless international delivery to your door.',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1920&q=85',
    mobileImageUrl: null,
    productImageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
    badgeText: 'WHOLESALE PRICING GUARANTEED',
    badgeColor: '#c9a84c',
    ctaText: 'Start Wholesale Order',
    ctaLink: '/wholesale',
    secondaryCtaText: 'View On-Sale Items',
    secondaryCtaLink: '/products?onSale=true',
    overlayColor: 'rgba(10, 22, 40, 0.75)',
    textColor: '#ffffff',
    displayOrder: 3,
    isActive: true,
    slideDuration: 6,
    alignment: 'left',
    motionType: 'zoom'
  }
]

export function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const { settings } = useSettings()
  const locale = useLocale()

  const { data } = useQuery({
    queryKey: ['hero-slides', 'active', locale],
    queryFn: () => api.get(`/api/hero-slides?locale=${locale}`),
    staleTime: 5 * 60 * 1000,
  })

  const fetchedSlides: HeroSlide[] = data?.data || []
  const slides: HeroSlide[] = fetchedSlides.length > 0 ? fetchedSlides : DEFAULT_CINEMATIC_SLIDES

  useEffect(() => {
    if (isPaused || slides.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, (slides[currentIndex]?.slideDuration || 6) * 1000)

    return () => clearInterval(timer)
  }, [currentIndex, slides, isPaused])

  const currentSlide = slides[currentIndex] || slides[0]

  const uiTranslations: Record<string, Record<string, string>> = {
    en: {
      factoryStock: 'Factory Stock Ready',
      wholesaleRetail: 'Wholesale & Retail Ready',
      subheading: 'High-Performance Industrial Hardware',
      moq: 'MOQ',
      moqUnits: '1 - 5 Units',
      clearance: 'Clearance',
      clearanceVal: 'CE / ISO',
      dispatch: 'Dispatch',
      dispatchVal: '24 - 48h',
      statSkus: 'Industrial SKUs',
      statFactories: 'Verified Factories',
      statPassRate: 'Pass Rate',
      statPorts: 'Global Ports',
      verifiedDirect: 'Verified Factory Direct',
      defaultBadge: 'INDUSTRIAL GRADE & CE CERTIFIED',
    },
    ru: {
      factoryStock: 'Готово к отгрузке',
      wholesaleRetail: 'Оптом и в розницу',
      subheading: 'Промышленное оборудование и инструмент',
      moq: 'Мин. заказ',
      moqUnits: '1 - 5 шт.',
      clearance: 'Стандарты',
      clearanceVal: 'CE / EAC',
      dispatch: 'Отгрузка',
      dispatchVal: '24 - 48ч',
      statSkus: 'Промышленных SKU',
      statFactories: 'Проверенных фабрик',
      statPassRate: 'Контроль качества',
      statPorts: 'Портов мира',
      verifiedDirect: 'Проверенный производитель',
      defaultBadge: 'ПРОМЫШЛЕННЫЙ СТАНДАРТ · CE/EAC',
    },
    zh: {
      factoryStock: '工厂现货直发',
      wholesaleRetail: '支持大宗批发与零售',
      subheading: '高精工业机床与重型装备',
      moq: '起订量',
      moqUnits: '1 - 5 台/套',
      clearance: '质量认证',
      clearanceVal: 'CE / ISO',
      dispatch: '发货时效',
      dispatchVal: '24 - 48小时',
      statSkus: '工业品现货SKU',
      statFactories: '认证源头工厂',
      statPassRate: '出厂合格率',
      statPorts: '全球通达港口',
      verifiedDirect: '认证源头工厂直供',
      defaultBadge: '工业级制造 · CE与ISO认证',
    }
  }

  const t = uiTranslations[locale] || uiTranslations.en

  return (
    <div 
      className="relative w-full min-h-[580px] lg:min-h-[720px] bg-[#0a1628] text-white overflow-hidden flex flex-col justify-between"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Cinematic Background Layer with Animated Meshes & Particles */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.title}
              className="w-full h-full object-cover object-center brightness-[0.4] contrast-125"
            />
          </motion.div>
        </AnimatePresence>

        {/* Ambient Dark Navy & Gold Radial Glows */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#0a1628]/85 to-[#0a1628]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-black/30" />
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-[#c9a84c]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* High-Tech Geometric Grid Lines */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* 2. Main Hero Slide Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 pt-16 sm:pt-20 lg:pt-24 pb-12 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full">
          
          {/* Left Column: Narrative, Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                {/* Badge Tag */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest bg-gradient-to-r from-[#c9a84c]/20 to-amber-500/20 text-[#e5c158] border border-[#c9a84c]/40 backdrop-blur-md shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#c9a84c]" />
                    {currentSlide.badgeText || t.defaultBadge}
                  </span>

                  <span className="hidden sm:inline-flex items-center text-xs font-semibold text-gray-300 gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {t.verifiedDirect}
                  </span>
                </div>

                {/* Subtitle */}
                {currentSlide.subtitle && (
                  <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-[#c9a84c] font-bold">
                    {currentSlide.subtitle}
                  </p>
                )}

                {/* Big Bold Headline */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                  {currentSlide.title}
                </h1>

                {/* Description */}
                <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
                  {currentSlide.description}
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-3">
                  <LocaleLink
                    href={currentSlide.ctaLink}
                    className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-[#c9a84c] via-[#d4b55e] to-[#c9a84c] text-primary-950 font-black text-sm uppercase tracking-wider shadow-gold hover:shadow-gold-lg hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 group"
                  >
                    <span>{currentSlide.ctaText}</span>
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </LocaleLink>

                  {currentSlide.secondaryCtaText && (
                    <LocaleLink
                      href={currentSlide.secondaryCtaLink || '/wholesale'}
                      className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm uppercase tracking-wider backdrop-blur-md hover:border-white/40 transition-all duration-200"
                    >
                      <span>{currentSlide.secondaryCtaText}</span>
                    </LocaleLink>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Floating 3D Product & Spec Card */}
          <div className="lg:col-span-5 relative hidden lg:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Floating Glassmorphism Spec Container */}
                <div className="relative rounded-3xl bg-gradient-to-br from-white/15 via-white/5 to-white/10 p-4 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden group">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-950">
                    <img
                      src={currentSlide.productImageUrl || currentSlide.imageUrl}
                      alt={currentSlide.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/90 via-transparent to-transparent" />

                    {/* Top Right Spec Tag */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[11px] font-bold text-[#e5c158] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      {t.factoryStock}
                    </div>

                    {/* Bottom Product Info */}
                    <div className="absolute bottom-4 left-4 right-4 space-y-1">
                      <div className="text-xs text-[#c9a84c] font-bold uppercase tracking-wider">
                        {t.wholesaleRetail}
                      </div>
                      <div className="text-sm font-bold text-white truncate">
                        {t.subheading}
                      </div>
                    </div>
                  </div>

                  {/* Spec Chips Bar */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-gray-400 font-medium">{t.moq}</div>
                      <div className="text-xs font-bold text-white mt-0.5">{t.moqUnits}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-gray-400 font-medium">{t.clearance}</div>
                      <div className="text-xs font-bold text-[#e5c158] mt-0.5">{t.clearanceVal}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-gray-400 font-medium">{t.dispatch}</div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5">{t.dispatchVal}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 3. Bottom Live Inventory Metrics Counter & Slide Navigation Bar */}
      <div className="relative z-10 border-t border-white/10 bg-[#0a1628]/80 backdrop-blur-md py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Live Platform Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full md:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <div className="text-base font-extrabold text-white">10,000+</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.statSkus}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#c9a84c]" />
              <div>
                <div className="text-base font-extrabold text-white">2,500+</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.statFactories}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <div>
                <div className="text-base font-extrabold text-white">99.7%</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.statPassRate}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <div>
                <div className="text-base font-extrabold text-white">180+</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.statPorts}</div>
              </div>
            </div>
          </div>

          {/* Slide Indicators & Controls */}
          {slides.length > 1 && (
            <div className="flex items-center gap-3 self-end md:self-auto">
              <span className="text-xs font-mono font-bold text-[#c9a84c]">
                0{currentIndex + 1} <span className="text-gray-500">/ 0{slides.length}</span>
              </span>

              <div className="flex gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      idx === currentIndex ? 'w-8 bg-[#c9a84c]' : 'w-2 bg-white/20 hover:bg-white/40'
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
