'use client'

import { useState, useEffect } from 'react'
import { LocaleLink } from '@/components/LocaleLink'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { TrustBadgesMini } from '@/components/TrustBadgesMini'
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

const motionVariants: Record<string, { initial: any; animate: any; exit: any }> = {
  slide: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  zoom: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
  flip: {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -90, opacity: 0 },
  },
  rotate: {
    initial: { rotate: -15, scale: 0.9, opacity: 0 },
    animate: { rotate: 0, scale: 1, opacity: 1 },
    exit: { rotate: 15, scale: 0.9, opacity: 0 },
  },
  scale: {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
}

export function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const { settings } = useSettings()
  const locale = useLocale()

  const { data, isLoading } = useQuery({
    queryKey: ['hero-slides', 'active', locale],
    queryFn: () => api.get(`/api/hero-slides?locale=${locale}`),
    staleTime: 5 * 60 * 1000,
  })

  const slides: HeroSlide[] = data?.data || []
  
  // Get company name from settings, fallback to 'Global Trade'
  const companyName = settings?.companyName || 'Global Trade'

  useEffect(() => {
    if (isPaused || slides.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, (slides[currentIndex]?.slideDuration || 5) * 1000)

    return () => clearInterval(interval)
  }, [currentIndex, slides, isPaused])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }

  if (isLoading) {
    return (
      <div className="bg-[#1a1a2e] min-h-[400px] flex items-center justify-center">
        <div className="text-white/50">Loading slides...</div>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="bg-[#1a1a2e] min-h-[400px] flex items-center justify-center">
        <div className="text-white/50">No slides available</div>
      </div>
    )
  }

  const slide = slides[currentIndex]
  const alignment = slide.alignment || 'left'

  const getTextAlignment = () => {
    switch (alignment) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  const getJustifyContent = () => {
    switch (alignment) {
      case 'center':
        return 'justify-center'
      case 'right':
        return 'justify-end'
      default:
        return 'justify-start'
    }
  }

  const getContentClasses = () => {
    switch (alignment) {
      case 'center':
        return 'mx-auto max-w-3xl'
      case 'right':
        return 'ml-auto max-w-3xl'
      default:
        return 'mr-auto max-w-3xl'
    }
  }

  const getImageOrder = () => {
    if (alignment === 'right') {
      return 'order-first lg:order-first'
    }
    return 'order-last lg:order-last'
  }

  const getImageJustify = () => {
    if (alignment === 'right') {
      return 'justify-start'
    }
    return 'justify-end'
  }

  return (
    <div className="relative overflow-hidden bg-[#1a1a2e]">
      <div className="relative w-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px] h-[60vh] sm:h-[70vh] md:h-[calc(100vh-164px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            variants={motionVariants[slide.motionType] || motionVariants.slide}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0"
            style={{ perspective: 1200 }}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              {slide.mobileImageUrl ? (
                <>
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    loading="eager"
                    className="hidden md:block w-full h-full object-cover"
                  />
                  <img
                    src={slide.mobileImageUrl}
                    alt={slide.title}
                    loading="eager"
                    className="md:hidden w-full h-full object-cover"
                  />
                </>
              ) : (
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              )}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: slide.overlayColor || 'rgba(26,58,92,0.6)' }}
              />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12 xl:px-16">
                <div className={cn(
                  'flex flex-col lg:flex-row gap-8 items-center',
                  getContentClasses()
                )}>

                  {/* Text Content with Staggered Motion */}
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: {},
                      show: {
                        transition: {
                          staggerChildren: 0.1,
                          delayChildren: 0.1
                        }
                      }
                    }}
                    className={cn(
                      'text-white space-y-6 flex-1',
                      getTextAlignment(),
                      alignment === 'center' ? 'items-center' :
                      alignment === 'right' ? 'items-end' : 'items-start'
                    )}
                  >
                    {/* Badge */}
                    {slide.badgeText && (
                      <motion.span
                        variants={{
                          hidden: { opacity: 0, y: -15, scale: 0.9 },
                          show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } }
                        }}
                        className={cn(
                          'inline-block text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg backdrop-blur-md border border-white/20',
                          alignment === 'center' && 'mx-auto',
                          alignment === 'right' && 'ml-auto'
                        )}
                        style={{
                          backgroundColor: slide.badgeColor || '#c9a84c',
                          color: slide.textColor || '#1a1a2e'
                        }}
                      >
                        {slide.badgeText}
                      </motion.span>
                    )}

                    {/* Subtitle */}
                    {slide.subtitle && (
                      <motion.p 
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                        }}
                        className={cn(
                          'text-sm md:text-base uppercase tracking-[0.15em] text-amber-300 font-semibold',
                          getTextAlignment()
                        )}
                      >
                        {slide.subtitle}
                      </motion.p>
                    )}

                    {/* Title */}
                    <motion.h1 
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
                      }}
                      className={cn(
                        'font-bold tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight text-shadow-lg break-words font-["Outfit",sans-serif]',
                        getTextAlignment()
                      )}
                    >
                      {slide.title}
                    </motion.h1>

                    {/* Description */}
                    {slide.description && (
                      <motion.p 
                        variants={{
                          hidden: { opacity: 0, y: 15 },
                          show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                        }}
                        className={cn(
                          'text-white/85 text-base md:text-lg leading-relaxed max-w-xl font-normal',
                          getTextAlignment()
                        )}
                      >
                        {slide.description}
                      </motion.p>
                    )}

                    {/* Buttons */}
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                      }}
                      className={cn(
                        'flex flex-wrap gap-4 pt-2',
                        getJustifyContent()
                      )}
                    >
                      <LocaleLink
                        href={slide.ctaLink}
                        className="bg-gradient-to-r from-[#c9a84c] via-[#d4b15c] to-[#e8d48b] text-[#1a1a2e] px-8 py-3.5 rounded-full font-bold text-sm md:text-base transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/25 inline-flex items-center gap-2 group"
                      >
                        {slide.ctaText}
                        <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                      </LocaleLink>

                      {slide.secondaryCtaText && slide.secondaryCtaLink && (
                        <LocaleLink
                          href={slide.secondaryCtaLink}
                          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-3.5 rounded-full font-semibold text-sm md:text-base transition-all duration-300 hover:bg-white/20 hover:scale-105 inline-flex items-center gap-2"
                        >
                          {slide.secondaryCtaText}
                        </LocaleLink>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Floating Product Image */}
                  {slide.productImageUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.85, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        y: [0, -10, 0]
                      }}
                      transition={{ 
                        opacity: { duration: 0.6, delay: 0.3 },
                        scale: { duration: 0.6, delay: 0.3 },
                        y: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                      }}
                      className={cn(
                        'flex-shrink-0',
                        getImageOrder(),
                        getImageJustify()
                      )}
                    >
                      <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#c9a84c]/20 to-blue-500/20 rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity" />
                        <img
                          src={slide.productImageUrl}
                          alt={slide.title}
                          loading="eager"
                          className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-contain drop-shadow-2xl"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Top Slide Progress Bar */}
        {!isPaused && slides.length > 1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30 overflow-hidden">
            <motion.div 
              key={`progress-${currentIndex}`}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ 
                duration: slides[currentIndex]?.slideDuration || 5, 
                ease: 'linear' 
              }}
              className="h-full bg-gradient-to-r from-[#c9a84c] to-[#e8d48b]"
            />
          </div>
        )}

        {/* Navigation Controls - Glass Effect */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/15 backdrop-blur-md border border-white/20 text-white p-3 rounded-full transition-all duration-300 hover:bg-white/30 hover:scale-110 hover:shadow-xl"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/15 backdrop-blur-md border border-white/20 text-white p-3 rounded-full transition-all duration-300 hover:bg-white/30 hover:scale-110 hover:shadow-xl"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="absolute bottom-6 left-6 z-20 bg-white/15 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-full transition-all duration-300 hover:bg-white/30 hover:scale-110 shadow-lg"
              aria-label={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2.5 items-center">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentIndex
                      ? 'w-8 h-2.5 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] shadow-md shadow-amber-500/30'
                      : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
