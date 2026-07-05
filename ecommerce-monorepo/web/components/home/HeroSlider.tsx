'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

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

  const { data, isLoading } = useQuery({
    queryKey: ['hero-slides', 'active'],
    queryFn: () => api.get('/api/hero-slides'),
    staleTime: 5 * 60 * 1000,
  })

  const slides: HeroSlide[] = data?.data || []

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

  // ============================================================
  // ALIGNMENT CLASSES
  // ============================================================

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

  // Content block width and margin
  const getContentClasses = () => {
    switch (alignment) {
      case 'center':
        return 'mx-auto max-w-2xl'
      case 'right':
        return 'ml-auto max-w-2xl'
      default:
        return 'mr-auto max-w-2xl'
    }
  }

  // Product image position
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

            {/* ============================================================ */}
            {/* CONTENT - WITH PROPER PADDING                                 */}
            {/* ============================================================ */}
            <div className="absolute inset-0 flex items-center">
              <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12 xl:px-16">
                <div className={cn(
                  'flex flex-col lg:flex-row gap-8 items-center',
                  getContentClasses()
                )}>
                  
                  {/* ============================================================ */}
                  {/* TEXT CONTENT                                               */}
                  {/* ============================================================ */}
                  <div className={cn(
                    'text-white space-y-4 flex-1',
                    getTextAlignment(),
                    alignment === 'center' ? 'items-center' : 
                    alignment === 'right' ? 'items-end' : 'items-start'
                  )}>
                    {/* Badge */}
                    {slide.badgeText && (
                      <span
                        className={cn(
                          'inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded',
                          alignment === 'center' && 'mx-auto',
                          alignment === 'right' && 'ml-auto'
                        )}
                        style={{
                          backgroundColor: slide.badgeColor || '#c9a84c',
                          color: slide.textColor || '#1a1a2e'
                        }}
                      >
                        {slide.badgeText}
                      </span>
                    )}

                    {/* Subtitle */}
                    {slide.subtitle && (
                      <p className={cn(
                        'text-sm uppercase tracking-widest text-white/80',
                        getTextAlignment()
                      )}>
                        {slide.subtitle}
                      </p>
                    )}

                    {/* Title */}
                    <h1 className={cn(
                      'text-3xl md:text-4xl lg:text-5xl font-bold leading-tight',
                      getTextAlignment()
                    )}>
                      {slide.title}
                    </h1>

                    {/* Description */}
                    {slide.description && (
                      <p className={cn(
                        'text-white/80 text-base md:text-lg',
                        getTextAlignment()
                      )}>
                        {slide.description}
                      </p>
                    )}

                    {/* Buttons */}
                    <div className={cn(
                      'flex flex-wrap gap-4 pt-2',
                      getJustifyContent()
                    )}>
                      <Link
                        href={slide.ctaLink}
                        className="bg-[#c9a84c] text-[#1a1a2e] px-6 py-2.5 rounded-full font-semibold hover:bg-[#e8d48b] transition-all transform hover:scale-105 inline-flex items-center"
                      >
                        {slide.ctaText}
                      </Link>

                      {slide.secondaryCtaText && slide.secondaryCtaLink && (
                        <Link
                          href={slide.secondaryCtaLink}
                          className="border border-white/30 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-white/10 transition-all inline-flex items-center"
                        >
                          {slide.secondaryCtaText}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* ============================================================ */}
                  {/* PRODUCT IMAGE                                               */}
                  {/* ============================================================ */}
                  {slide.productImageUrl && (
                    <div className={cn(
                      'flex-shrink-0',
                      getImageOrder(),
                      getImageJustify()
                    )}>
                      <img
                        src={slide.productImageUrl}
                        alt={slide.title}
                        loading="eager"
                        className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ============================================================ */}
        {/* NAVIGATION CONTROLS                                          */}
        {/* ============================================================ */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="absolute bottom-20 left-4 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition"
              aria-label={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/70'
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
