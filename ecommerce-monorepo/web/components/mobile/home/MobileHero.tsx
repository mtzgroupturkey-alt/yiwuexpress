'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowRight, Sparkles, ShieldCheck, Truck, Factory } from 'lucide-react'
import { useSettings } from '@/components/SettingsProvider'
import { useMobile } from '@/components/MobileProvider'

export interface HeroSlide {
  id: string
  badge?: string
  title: string
  subtitle: string
  ctaText: string
  href: string
  image?: string
  imageUrl?: string
  bgGradient?: string
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

  const defaultSlides: HeroSlide[] = [
    {
      id: '1',
      badge:
        locale === 'zh'
          ? '源头工厂 · 一手货源'
          : locale === 'ru'
          ? 'Прямые поставки с фабрик'
          : 'Direct From Verified Factories',
      title:
        locale === 'zh'
          ? '中国直采全球直发'
          : locale === 'ru'
          ? 'Оборудование и товары из Китая'
          : 'Sourcing Direct From China',
      subtitle:
        locale === 'zh'
          ? '数万家认证制造企业，出厂底价，集装箱或拼箱极速交付'
          : locale === 'ru'
          ? 'Тысячи заводов, оптовые цены, доставка морем и авиа'
          : 'Verified manufacturers, wholesale pricing, express air & sea logistics',
      ctaText:
        locale === 'zh'
          ? '立即探索商品'
          : locale === 'ru'
          ? 'Смотреть каталог'
          : 'Explore Catalog',
      href: '/store',
      image:
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop',
      bgGradient: 'from-[#002f5e] via-[#00407a] to-[#0a5296]',
      icon: <Factory className="w-3.5 h-3.5 text-[#F5A602]" />,
    },
    {
      id: '2',
      badge:
        locale === 'zh'
          ? '大宗批发 · 阶梯特惠'
          : locale === 'ru'
          ? 'Оптовые скидки и партии'
          : 'Wholesale MOQ Discounts',
      title:
        locale === 'zh'
          ? 'B2B批发询价通道'
          : locale === 'ru'
          ? 'Запрос цен и оптовые квоты'
          : 'Wholesale & B2B Volume Pricing',
      subtitle:
        locale === 'zh'
          ? '支持定制开模、样品寄送与全流程专业品控把关'
          : locale === 'ru'
          ? 'Контроль качества перед отгрузкой, образцы и документы'
          : 'Pre-shipment inspection, custom production, dedicated trade assistance',
      ctaText:
        locale === 'zh'
          ? '批发大单通道'
          : locale === 'ru'
          ? 'Оптовый раздел'
          : 'Wholesale Sourcing',
      href: '/wholesale',
      image:
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop',
      bgGradient: 'from-[#112233] via-[#1a3a5c] to-[#254b77]',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: '3',
      badge:
        locale === 'zh'
          ? '专线物流 · 双清包税'
          : locale === 'ru'
          ? 'Таможенная очистка и логистика'
          : 'Global Freight & Customs',
      title:
        locale === 'zh'
          ? '全球门到门极速交付'
          : locale === 'ru'
          ? 'Быстрая доставка от двери до двери'
          : 'Door-to-Door Worldwide Delivery',
      subtitle:
        locale === 'zh'
          ? '国际海运、空运快速清关，实时包裹追踪全程无忧'
          : locale === 'ru'
          ? 'Авиа и морские перевозки, трекинг и страхование грузов'
          : 'Express air cargo, ocean freight, customs clearance, real-time tracking',
      ctaText:
        locale === 'zh'
          ? '运费查询计算'
          : locale === 'ru'
          ? 'Калькулятор доставки'
          : 'Calculate Freight',
      href: '/calculator',
      image:
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop',
      bgGradient: 'from-[#0b172a] via-[#152a4a] to-[#1e3a66]',
      icon: <Truck className="w-3.5 h-3.5 text-blue-400" />,
    },
  ]

  // 10. Fallback: if no slides (explicitly empty array), do not render the section
  const slides = customSlides !== undefined ? customSlides : defaultSlides

  if (!slides || slides.length === 0) {
    console.info('[MobileHero] No active hero slides found for locale, skipping render.')
    return null
  }

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 4. Auto-rotate every 5 seconds, 5. Pause when user touches / hovers / prefers reduced motion
  useEffect(() => {
    if (isPaused || slides.length <= 1) return

    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % slides.length
        if (containerRef.current) {
          const width = containerRef.current.clientWidth || 0
          if (typeof containerRef.current.scrollTo === 'function') {
            containerRef.current.scrollTo({ left: next * width, behavior: 'smooth' })
          } else {
            containerRef.current.scrollLeft = next * width
          }
        }
        return next
      })
    }, 5000)

    return () => clearInterval(timer)
  }, [isPaused, slides.length])

  // 12. Swipe left/right works via scroll detection
  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollLeft, clientWidth } = containerRef.current
    if (!clientWidth) return
    const newIdx = Math.round(scrollLeft / clientWidth)
    if (newIdx !== currentIndex && newIdx >= 0 && newIdx < slides.length) {
      setCurrentIndex(newIdx)
    }
  }

  // 11. Dot buttons clickable to jump to slide
  const goToSlide = (idx: number) => {
    setCurrentIndex(idx)
    if (containerRef.current) {
      const width = containerRef.current.clientWidth || 0
      if (typeof containerRef.current.scrollTo === 'function') {
        containerRef.current.scrollTo({ left: idx * width, behavior: 'smooth' })
      } else {
        containerRef.current.scrollLeft = idx * width
      }
    }
  }

  const handleCtaClick = (slide: HeroSlide) => {
    if (onShopNow) {
      onShopNow()
    } else {
      router.push(`/${locale}${slide.href}`)
    }
  }

  return (
    <section
      data-testid="mobile-hero"
      aria-label="Mobile Hero Carousel"
      className={`relative w-full h-[55vh] min-h-[340px] max-h-[480px] overflow-hidden select-none ${className}`}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 2. Horizontal scroll with snap-to-next, 1 slide = 100vw width, full height */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            data-testid={`hero-slide-${idx}`}
            className="w-full min-w-full shrink-0 h-full snap-center relative flex flex-col justify-end p-5 pb-12 text-white overflow-hidden"
          >
            {/* 7. Background image + gradient fallback */}
            {slide.image || slide.imageUrl ? (
              <img
                src={slide.image || slide.imageUrl}
                alt={slide.title}
                loading={idx === 0 ? 'eager' : 'lazy'}
                // 9. First slide image loads with priority
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className={`absolute inset-0 bg-gradient-to-br ${
                  slide.bgGradient || 'from-[#002f5e] via-[#00407a] to-[#0a5296]'
                }`}
              />
            )}

            {/* Gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

            {/* Slide Content */}
            <div className="relative z-10 space-y-2 max-w-md">
              {/* Optional Badge */}
              {slide.badge && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white border border-white/20 shadow-xs">
                  {slide.icon || <Sparkles className="w-3.5 h-3.5 text-[#F5A602]" />}
                  <span>{slide.badge}</span>
                </div>
              )}

              {/* Headline (2 lines max) */}
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white line-clamp-2 drop-shadow-md">
                {slide.title}
              </h2>

              {/* Subtitle (2 lines max) */}
              <p className="text-xs sm:text-sm text-white/90 line-clamp-2 leading-relaxed max-w-[95%] drop-shadow-xs">
                {slide.subtitle}
              </p>

              {/* 7. CTA button (44px height) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleCtaClick(slide)}
                  aria-label={slide.ctaText}
                  className="min-h-[44px] h-[44px] px-6 rounded-xl bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-extrabold text-xs inline-flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform touch-manipulation cursor-pointer"
                >
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 6. Dots indicator at bottom (small pill for active slide) */}
      <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => goToSlide(idx)}
            aria-label={`Slide ${idx + 1}`}
            className="min-h-[32px] min-w-[28px] flex items-center justify-center touch-manipulation cursor-pointer"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                currentIndex === idx
                  ? 'w-6 h-1.5 bg-[#F5A602] shadow-xs'
                  : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
