'use client'

import { useState, useEffect } from 'react'
import { LocaleLink } from '@/components/LocaleLink'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Tag,
  Clock,
  SendHorizontal
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
    title: 'Industrial Machinery & Precision CNC Equipment',
    subtitle: 'FACTORY-DIRECT B2B WHOLESALE & RETAIL',
    description: 'Direct procurement from Tier-1 Chinese manufacturers. High-precision CNC centers, hydraulic presses, automated production lines with full CE & ISO certification.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=85',
    mobileImageUrl: null,
    productImageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    badgeText: 'PREMIUM INDUSTRIAL SELECTION',
    badgeColor: '#0055A4',
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
    badgeColor: '#0055A4',
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
    badgeColor: '#0055A4',
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
  const [countdown, setCountdown] = useState({ hours: 7, minutes: 42, seconds: 19 })
  const { settings } = useSettings()
  const locale = useLocale()

  const { data } = useQuery({
    queryKey: ['hero-slides', 'active', locale],
    queryFn: () => api.get(`/api/hero-slides?locale=${locale}`),
    staleTime: 5 * 60 * 1000,
  })

  const fetchedSlides: HeroSlide[] = data?.data || []
  const slides: HeroSlide[] = fetchedSlides.length > 0 ? fetchedSlides : DEFAULT_CINEMATIC_SLIDES

  // Autoplay ticker
  useEffect(() => {
    if (isPaused || slides.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, (slides[currentIndex]?.slideDuration || 6) * 1000)

    return () => clearInterval(timer)
  }, [currentIndex, slides, isPaused])

  // Live countdown timer for Flash Deals mini-banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return { hours: 23, minutes: 59, seconds: 59 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

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
      promoTopTitle: 'Express Direct Factory Sourcing',
      promoTopSub: 'Get container loads & custom OEM quotes within 24 hours',
      promoTopCta: 'Request Quick RFQ',
      promoBottomTitle: 'Flash Discounts of the Day',
      promoBottomSub: 'Save up to 40% on certified machinery stock',
      promoBottomCta: 'View Flash Deals',
      dealEndsIn: 'Ends in',
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
      promoTopTitle: 'Прямые поставки с фабрик Китая',
      promoTopSub: 'Контейнерные партии и OEM под ключ за 24 часа',
      promoTopCta: 'Запросить расчет (RFQ)',
      promoBottomTitle: 'Суперцены и Акции дня',
      promoBottomSub: 'Скидки до 40% на промышленный склад',
      promoBottomCta: 'Смотреть скидки',
      dealEndsIn: 'До конца:',
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
      promoTopTitle: '源头工厂集采直供',
      promoTopSub: '整柜大宗集采 · 24小时专属RFQ核价',
      promoTopCta: '立即发起询价',
      promoBottomTitle: '每日特价限时秒杀',
      promoBottomSub: '工厂爆款现货直降高达 40%',
      promoBottomCta: '查看特价专区',
      dealEndsIn: '距结束:',
    }
  }

  const t = uiTranslations[locale] || uiTranslations.en

  return (
    <div 
      className="relative w-full min-h-[580px] lg:min-h-[660px] bg-[#0a1628] text-white overflow-hidden flex flex-col justify-between"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Cinematic Background Layer with 700ms cross-fade transition */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0"
          >
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.title}
              className="w-full h-full object-cover object-center brightness-[0.32] contrast-125"
            />
          </motion.div>
        </AnimatePresence>

        {/* Ambient Dark Navy & Radial Glows */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#0a1628]/85 to-[#0a1628]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-black/30" />
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-[#0055A4]/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[#0055A4]/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Geometric Grid Lines */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* 2. Main Hero Slide Content: 70% Slider + 30% Dual Mini-Banners */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 pt-10 sm:pt-14 lg:pt-16 pb-10 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch w-full">
          
          {/* Left / Center: 68% Slider Area */}
          <div className="lg:col-span-8 flex flex-col justify-center space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                className="space-y-5"
              >
                {/* Badge Tag */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-600/30 text-blue-200 border border-blue-400/40 backdrop-blur-md shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                    {currentSlide.badgeText || t.defaultBadge}
                  </span>

                  <span className="hidden sm:inline-flex items-center text-xs font-semibold text-gray-300 gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {t.verifiedDirect}
                  </span>
                </div>

                {/* Subtitle */}
                {currentSlide.subtitle && (
                  <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-amber-400 font-bold">
                    {currentSlide.subtitle}
                  </p>
                )}

                {/* Big Bold Headline */}
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] text-white font-['Outfit',sans-serif]">
                  {currentSlide.title}
                </h1>

                {/* Description */}
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-2xl line-clamp-3">
                  {currentSlide.description}
                </p>

                {/* CTA Action Buttons with Gradient & Hover Lift */}
                <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                  <LocaleLink
                    href={currentSlide.ctaLink}
                    className="inline-flex items-center justify-center px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#0055A4] via-[#0066c0] to-[#0055A4] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 group border border-blue-400/30"
                  >
                    <span>{currentSlide.ctaText}</span>
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </LocaleLink>

                  {currentSlide.secondaryCtaText && (
                    <LocaleLink
                      href={currentSlide.secondaryCtaLink || '/wholesale'}
                      className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs sm:text-sm uppercase tracking-wider backdrop-blur-md hover:border-white/40 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <span>{currentSlide.secondaryCtaText}</span>
                    </LocaleLink>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Two Stacked Mini-Banners with Glassmorphism Overlay */}
          <div className="lg:col-span-4 hidden lg:flex flex-col gap-4 justify-between">
            {/* Top Mini-Banner: Express Direct Factory Sourcing RFQ */}
            <LocaleLink
              href="/wholesale"
              className="group relative rounded-3xl bg-black/40 backdrop-blur-md p-5 border-l-4 border-l-blue-500 border-t border-r border-b border-white/15 hover:border-blue-400/60 shadow-xl overflow-hidden transition-all duration-300 flex flex-col justify-between flex-1 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-all" />
              
              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-extrabold uppercase">
                  <SendHorizontal className="w-3 h-3 text-blue-400" />
                  <span>B2B Fast Sourcing</span>
                </div>
                <h3 className="text-base font-black text-white group-hover:text-blue-300 transition-colors leading-snug">
                  {t.promoTopTitle}
                </h3>
                <p className="text-xs text-gray-300 line-clamp-2">
                  {t.promoTopSub}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-blue-300 group-hover:text-white transition-colors">
                <span>{t.promoTopCta}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </LocaleLink>

            {/* Bottom Mini-Banner: Flash Deals with Live Countdown */}
            <LocaleLink
              href="/products?onSale=true"
              className="group relative rounded-3xl bg-black/40 backdrop-blur-md p-5 border-l-4 border-l-[#DC2626] border-t border-r border-b border-white/15 hover:border-red-500/60 shadow-xl overflow-hidden transition-all duration-300 flex flex-col justify-between flex-1 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-red-500/20 transition-all" />
              
              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/25 border border-red-500/40 text-red-200 text-[10px] font-extrabold uppercase">
                    <Tag className="w-3 h-3 text-red-400" />
                    <span>SUPER PRICE</span>
                  </div>
                  
                  {/* Live Countdown Clock */}
                  <div className="flex items-center gap-1 text-[11px] text-amber-300 font-mono font-bold bg-black/50 px-2 py-0.5 rounded-md border border-amber-400/20">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}</span>
                  </div>
                </div>

                <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                  {t.promoBottomTitle}
                </h3>
                <p className="text-xs text-gray-300 line-clamp-2">
                  {t.promoBottomSub}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-300 group-hover:text-white transition-colors">
                <span>{t.promoBottomCta}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </LocaleLink>
          </div>

        </div>
      </div>

      {/* 3. Bottom Live Inventory Metrics Counter & Slide Navigation Bar */}
      <div className="relative z-10 border-t border-white/10 bg-[#0a1628]/85 backdrop-blur-md py-3.5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Live Platform Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full md:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <div className="text-sm sm:text-base font-extrabold text-white">10,000+</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.statSkus}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <div>
                <div className="text-sm sm:text-base font-extrabold text-white">2,500+</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.statFactories}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div>
                <div className="text-sm sm:text-base font-extrabold text-white">99.7%</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.statPassRate}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <div>
                <div className="text-sm sm:text-base font-extrabold text-white">180+</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.statPorts}</div>
              </div>
            </div>
          </div>

          {/* Slide Indicators & Controls */}
          {slides.length > 1 && (
            <div className="flex items-center gap-3 self-end md:self-auto">
              <span className="text-xs font-mono font-bold text-blue-300">
                0{currentIndex + 1} <span className="text-gray-500">/ 0{slides.length}</span>
              </span>

              <div className="flex gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                      idx === currentIndex ? 'w-8 bg-[#0055A4]' : 'w-2 bg-white/20 hover:bg-white/40'
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
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
