'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles, ShieldCheck, Truck, Factory, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSettings } from '@/components/SettingsProvider'

export interface HeroSlide {
  id: string
  badge: string
  title: string
  subtitle: string
  ctaText: string
  href: string
  bgGradient: string
  icon?: React.ReactNode
}

interface MobileHeroProps {
  slides?: HeroSlide[]
  onShopNow?: () => void
  className?: string
}

export function MobileHero({
  slides: customSlides,
  onShopNow,
  className = '',
}: MobileHeroProps) {
  const router = useRouter()
  const locale = useLocale()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'

  const defaultSlides: HeroSlide[] = [
    {
      id: '1',
      badge: locale === 'zh' ? '源头工厂 · 一手货源' : locale === 'ru' ? 'Прямые поставки с фабрик' : 'Direct From Verified Factories',
      title: locale === 'zh' ? '中国直采全球直发' : locale === 'ru' ? 'Оборудование и товары из Китая' : 'Sourcing Direct From China',
      subtitle: locale === 'zh' ? '数万家认证制造企业，出厂底价，集装箱或拼箱极速交付' : locale === 'ru' ? 'Тысячи заводов, оптовые цены, доставка морем и авиа' : 'Verified manufacturers, wholesale pricing, express air & sea logistics',
      ctaText: locale === 'zh' ? '立即探索商品' : locale === 'ru' ? 'Смотреть каталог' : 'Explore Catalog',
      href: '/store',
      bgGradient: 'from-[#002f5e] via-[#00407a] to-[#0a5296]',
      icon: <Factory className="w-4 h-4 text-[#F5A602]" />,
    },
    {
      id: '2',
      badge: locale === 'zh' ? '大宗批发 · 阶梯特惠' : locale === 'ru' ? 'Оптовые скидки и партии' : 'Wholesale MOQ Discounts',
      title: locale === 'zh' ? 'B2B批发询价通道' : locale === 'ru' ? 'Запрос цен и оптовые квоты' : 'Wholesale & B2B Volume Pricing',
      subtitle: locale === 'zh' ? '支持定制开模、样品寄送与全流程专业品控把关' : locale === 'ru' ? 'Контроль качества перед отгрузкой, образцы и документы' : 'Pre-shipment inspection, custom production, dedicated trade assistance',
      ctaText: locale === 'zh' ? '批发大单通道' : locale === 'ru' ? 'Оптовый раздел' : 'Wholesale Sourcing',
      href: '/wholesale',
      bgGradient: 'from-[#112233] via-[#1a3a5c] to-[#254b77]',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: '3',
      badge: locale === 'zh' ? '专线物流 · 双清包税' : locale === 'ru' ? 'Таможенная очистка и логистика' : 'Global Freight & Customs',
      title: locale === 'zh' ? '全球门到门极速交付' : locale === 'ru' ? 'Быстрая доставка от двери до двери' : 'Door-to-Door Worldwide Delivery',
      subtitle: locale === 'zh' ? '国际海运、空运快速清关，实时包裹追踪全程无忧' : locale === 'ru' ? 'Авиа и морские перевозки, трекинг и страхование грузов' : 'Express air cargo, ocean freight, customs clearance, real-time tracking',
      ctaText: locale === 'zh' ? '运费查询计算' : locale === 'ru' ? 'Калькулятор доставки' : 'Calculate Freight',
      href: '/calculator',
      bgGradient: 'from-[#0b172a] via-[#152a4a] to-[#1e3a66]',
      icon: <Truck className="w-4 h-4 text-blue-400" />,
    },
  ]

  const slides = customSlides || defaultSlides
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [slides.length])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const currentSlide = slides[currentIndex]

  const handleCtaClick = () => {
    if (onShopNow) {
      onShopNow()
    } else {
      router.push(`/${locale}${currentSlide.href}`)
    }
  }

  return (
    <section
      data-testid="mobile-hero"
      aria-label="Mobile Hero Carousel"
      className={`relative w-full overflow-hidden px-3 pt-3 pb-2 select-none ${className}`}
    >
      <div className="relative w-full rounded-3xl overflow-hidden shadow-lg min-h-[260px] flex flex-col justify-between p-5 text-white">
        {/* Animated Background Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`absolute inset-0 bg-gradient-to-br ${currentSlide.bgGradient}`}
          >
            {/* Background patterns */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full blur-xl pointer-events-none -ml-8 -mb-8" />
          </motion.div>
        </AnimatePresence>

        {/* Slide Content */}
        <div className="relative z-10 space-y-2.5">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold text-white/95 border border-white/20">
            {currentSlide.icon || <Sparkles className="w-3.5 h-3.5 text-[#F5A602]" />}
            <span>{currentSlide.badge}</span>
          </div>

          {/* Headline */}
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight drop-shadow-xs">
            {currentSlide.title}
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-white/80 line-clamp-2 leading-relaxed max-w-[90%]">
            {currentSlide.subtitle}
          </p>
        </div>

        {/* Bottom Bar: Action Button + Dot Indicators */}
        <div className="relative z-10 pt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCtaClick}
            className="min-h-[48px] px-5 bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-bold text-xs rounded-2xl flex items-center gap-2 shadow-md active:scale-95 transition-transform touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>{currentSlide.ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Carousel Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`min-h-[28px] min-w-[28px] flex items-center justify-center`}
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    currentIndex === idx
                      ? 'w-6 h-2 bg-[#F5A602]'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
