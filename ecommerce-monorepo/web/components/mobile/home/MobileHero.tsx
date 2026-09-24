'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowRight, Sparkles, ShieldCheck, Truck, Factory, ChevronLeft, ChevronRight } from 'lucide-react'
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

const LOCAL_HERO_FALLBACKS = [
  '/images/hero/hero-1.jpg',
  '/images/hero/hero-2.jpg',
  '/images/hero/hero-3.jpg',
  '/uploads/general/1783111746070-3d4329c4824b0db3e33a8ebc287f8486.jpg',
  '/uploads/general/1783111760596-3d1db3241362aaa0526d244d94eb6a0a.jpg',
]

export function MobileHero({
  slides: customSlides,
  onShopNow,
  className = '',
}: MobileHeroProps) {
  const router = useRouter()
  const locale = useLocale()
  const { settings } = useSettings()
  const { isStandalone } = useMobile()

  // ALL hooks must be called unconditionally at the top
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [apiSlides, setApiSlides] = useState<HeroSlide[] | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Fetch real dynamic hero slides from API using useEffect so it's safe without QueryClientProvider
  useEffect(() => {
    let active = true
    if (typeof fetch === 'function') {
      fetch(`/api/hero-slides?locale=${encodeURIComponent(locale || 'en')}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!active || !data?.data || !Array.isArray(data.data) || data.data.length === 0) return
          const mapped = data.data.map((item: any, idx: number) => {
            const fallbackImg = LOCAL_HERO_FALLBACKS[idx % LOCAL_HERO_FALLBACKS.length]
            let img = item.mobileImageUrl || item.imageUrl || item.image || fallbackImg
            // Automatically replace blocked/unreliable Unsplash images with local high-res photos
            if (!img || img.includes('unsplash.com')) {
              img = fallbackImg
            }
            return {
              id: String(item.id || idx),
              badge: item.badgeText || item.tag || item.subtag || '',
              title: item.title || item.headline || '',
              subtitle: item.subtitle || item.description || '',
              ctaText: item.ctaText || item.btnText || (locale === 'zh' ? '立即探索' : locale === 'ru' ? 'Смотреть' : 'Explore Catalog'),
              href: item.ctaLink || item.btnLink || '/store',
              image: img,
              bgGradient: item.overlayGradient || 'from-[#002f5e] via-[#00407a] to-[#0a5296]',
              icon: <Sparkles className="w-3.5 h-3.5 text-[#F5A602]" />,
            }
          })
          setApiSlides(mapped)
        })
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [locale])

  const defaultSlides: HeroSlide[] = useMemo(() => [
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
      image: '/images/hero/hero-1.jpg',
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
      image: '/images/hero/hero-2.jpg',
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
      image: '/images/hero/hero-3.jpg',
      bgGradient: 'from-[#0b172a] via-[#152a4a] to-[#1e3a66]',
      icon: <Truck className="w-3.5 h-3.5 text-blue-400" />,
    },
  ], [locale])

  const slides = customSlides !== undefined ? customSlides : (apiSlides || defaultSlides)
  const hasSlides = slides && slides.length > 0

  // Auto-rotate every 5 seconds (works in both modes, pauses on user interaction)
  useEffect(() => {
    if (!hasSlides || isPaused || slides.length <= 1) return

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
  }, [isPaused, slides.length, hasSlides])

  if (!hasSlides) {
    return null
  }

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollLeft, clientWidth } = containerRef.current
    if (!clientWidth) return
    const newIdx = Math.round(scrollLeft / clientWidth)
    if (newIdx !== currentIndex && newIdx >= 0 && newIdx < slides.length) {
      setCurrentIndex(newIdx)
    }
  }

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

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    const prevIdx = (currentIndex - 1 + slides.length) % slides.length
    goToSlide(prevIdx)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextIdx = (currentIndex + 1) % slides.length
    goToSlide(nextIdx)
  }

  const handleCtaClick = (slide: HeroSlide) => {
    if (onShopNow) {
      onShopNow()
    } else {
      router.push(`/${locale}${slide.href}`)
    }
  }

  // ─── BROWSER MODE: Website Responsive Slider Card ─────────────────────────
  if (!isStandalone) {
    return (
      <section
        data-testid="mobile-hero"
        aria-label="Mobile Hero Slider"
        className={`w-full px-3 sm:px-4 py-2 select-none ${className}`}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Responsive Rounded Slider Card */}
        <div className="relative rounded-2xl overflow-hidden h-[260px] sm:h-[300px] shadow-md border border-slate-200/80 bg-gradient-to-br from-[#003366] via-[#00407a] to-[#0055a4] group">
          {/* Swipeable slides */}
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
                className="w-full min-w-full shrink-0 h-full snap-center relative flex flex-col justify-end p-5 pb-10 text-white overflow-hidden"
              >
                {/* Background image */}
                {slide.image || slide.imageUrl ? (
                  <img
                    src={slide.image || slide.imageUrl}
                    alt={slide.title}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={idx === 0 ? 'high' : 'low'}
                    width={800}
                    height={400}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      const fallback = LOCAL_HERO_FALLBACKS[idx % LOCAL_HERO_FALLBACKS.length]
                      if (target.src && !target.src.endsWith(fallback)) {
                        target.src = fallback
                      } else {
                        target.style.display = 'none'
                      }
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : null}
                <div
                  className={`absolute inset-0 -z-10 bg-gradient-to-br ${
                    slide.bgGradient || 'from-[#003366] via-[#00407a] to-[#0055a4]'
                  }`}
                />

                {/* Studio gradient overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#001f3f]/70 via-[#002b54]/25 to-transparent pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 space-y-1.5 max-w-[88%]">
                  {slide.badge && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 shadow-xs">
                      {slide.icon || <Sparkles className="w-3 h-3 text-[#F5A602]" />}
                      <span className="truncate">{slide.badge}</span>
                    </div>
                  )}

                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white line-clamp-2 drop-shadow-md">
                    {slide.title}
                  </h2>

                  <p className="text-xs text-white/90 line-clamp-2 leading-relaxed drop-shadow-xs">
                    {slide.subtitle}
                  </p>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleCtaClick(slide)}
                      aria-label={slide.ctaText}
                      className="min-h-[44px] h-[44px] px-5 rounded-xl bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform touch-manipulation cursor-pointer"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Left & Right arrows for easy navigation */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous slide"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs flex items-center justify-center transition-all opacity-70 hover:opacity-100 touch-manipulation"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next slide"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs flex items-center justify-center transition-all opacity-70 hover:opacity-100 touch-manipulation"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Dots indicator */}
          <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className="min-h-[28px] min-w-[22px] flex items-center justify-center touch-manipulation cursor-pointer"
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
        </div>
      </section>
    )
  }

  // ─── STANDALONE / PWA MODE: Native App Carousel (Edge-to-edge, 55vh) ──────
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
            {slide.image || slide.imageUrl ? (
              <img
                src={slide.image || slide.imageUrl}
                alt={slide.title}
                loading={idx === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={idx === 0 ? 'high' : 'low'}
                width={800}
                height={500}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  const fallback = LOCAL_HERO_FALLBACKS[idx % LOCAL_HERO_FALLBACKS.length]
                  if (target.src && !target.src.endsWith(fallback)) {
                    target.src = fallback
                  } else {
                    target.style.display = 'none'
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : null}
            <div
              className={`absolute inset-0 -z-10 bg-gradient-to-br ${
                slide.bgGradient || 'from-[#003366] via-[#00407a] to-[#0055a4]'
              }`}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#001f3f]/70 via-[#002b54]/25 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-2 max-w-md">
              {slide.badge && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white border border-white/20 shadow-xs">
                  {slide.icon || <Sparkles className="w-3.5 h-3.5 text-[#F5A602]" />}
                  <span>{slide.badge}</span>
                </div>
              )}

              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white line-clamp-2 drop-shadow-md">
                {slide.title}
              </h2>

              <p className="text-xs sm:text-sm text-white/90 line-clamp-2 leading-relaxed max-w-[95%] drop-shadow-xs">
                {slide.subtitle}
              </p>

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

      {/* Dots indicator */}
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
