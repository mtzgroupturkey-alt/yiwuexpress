'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles, ArrowRight, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Container } from '@/components/ui/Container'

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
  motionType: string
}

export function ModernHeroSlider() {
  const [[page, direction], setPage] = useState([0, 0])
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [progress, setProgress] = useState(0)
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['hero-slides', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/hero-slides')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
  })

  const slides: HeroSlide[] = data?.data || []
  const slideIndex = ((page % slides.length) + slides.length) % slides.length

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection])
    setProgress(0)
  }

  const goToSlide = (index: number) => {
    const newDirection = index > slideIndex ? 1 : -1
    setPage([index, newDirection])
    setProgress(0)
  }

  // Progress bar animation
  useEffect(() => {
    if (slides.length === 0 || isPaused || isHovered) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      return
    }

    const currentSlide = slides[slideIndex]
    const duration = (currentSlide?.slideDuration || 5) * 1000
    const step = 100 / (duration / 50)

    setProgress(0)
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100
        }
        return prev + step
      })
    }, 50)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [page, slides, isPaused, isHovered, slideIndex])

  // Auto-play logic
  useEffect(() => {
    if (slides.length === 0 || isPaused || isHovered) {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current)
      }
      return
    }

    const currentSlide = slides[slideIndex]
    const duration = (currentSlide?.slideDuration || 5) * 1000

    autoPlayTimeoutRef.current = setTimeout(() => {
      paginate(1)
    }, duration)

    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current)
      }
    }
  }, [page, slides, isPaused, isHovered, slideIndex])

  if (isLoading) {
    return (
      <div className="relative bg-gradient-to-br from-[#1a3a5c] via-[#2a4a6c] to-[#1a3a5c] h-[calc(100vh-164px)] flex items-center justify-center overflow-hidden">
        {/* Animated Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-20 left-20 w-96 h-96 bg-[#c9a84c]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-[#c9a84c]/20 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/50 flex items-center gap-3"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
          />
          <span className="text-lg font-medium">Loading amazing content...</span>
        </motion.div>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <section className="relative bg-gradient-to-br from-[#1a3a5c] via-[#2a4a6c] to-[#1a3a5c] h-[calc(100vh-164px)] overflow-hidden flex items-center justify-center">
        {/* Animated Background Elements */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-0 left-0 w-full h-full opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201, 168, 76, 0.3) 0%, transparent 50%)',
          }}
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute top-0 right-0 w-full h-full opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(201, 168, 76, 0.3) 0%, transparent 50%)',
          }}
        />

        <Container>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-8 md:py-12"
          >
            {/* Left Content */}
            <div className="text-white space-y-8 z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="inline-flex items-center gap-2 bg-[#c9a84c]/20 backdrop-blur-sm px-4 py-2 rounded-full border border-[#c9a84c]/30"
              >
                <Sparkles className="w-4 h-4 text-[#c9a84c]" />
                <span className="text-[#c9a84c] text-sm font-semibold">Welcome to</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  YIWU EXPRESS
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-white/80 text-xl leading-relaxed max-w-xl"
              >
                Your trusted partner for global trade and logistics solutions from the world's largest commodity market.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex flex-wrap gap-4"
              >
                <Link
                  href="/products"
                  className="group relative bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#1a1a2e] px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-[#c9a84c]/50 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    EXPLORE PRODUCTS
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#e8d48b] to-[#c9a84c]"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>

                <Link
                  href="/contact"
                  className="group relative border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                >
                  <span className="flex items-center gap-2">
                    CONTACT US
                    <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </span>
                </Link>
              </motion.div>

              {/* Feature Pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap gap-3 pt-4"
              >
                {['Premium Quality', 'Fast Shipping', 'Best Prices'].map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#c9a84c]" />
                    <span className="text-sm font-medium text-white/90">{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right Content - Floating Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="relative hidden lg:block"
            >
              {/* Floating Cards Animation */}
              <div className="relative w-full h-[500px]">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 5, 0],
                    }}
                    transition={{
                      duration: 3 + i,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.2,
                    }}
                    className="absolute bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl"
                    style={{
                      top: `${i * 30}%`,
                      left: `${i * 15}%`,
                      width: '250px',
                      height: '200px',
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#e8d48b] mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-white/20 rounded-full w-3/4" />
                      <div className="h-3 bg-white/10 rounded-full w-full" />
                      <div className="h-3 bg-white/10 rounded-full w-2/3" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </Container>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/5 to-transparent" />
      </section>
    )
  }

  const slide = slides[slideIndex]

  return (
    <div
      className="relative overflow-hidden h-[calc(100vh-164px)] bg-gradient-to-br from-[#1a3a5c] via-[#2a4a6c] to-[#1a3a5c] flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Hero slider"
      aria-live="polite"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* Background Image with Parallax Effect */}
          <motion.div
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            {slide.mobileImageUrl ? (
              <>
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="hidden md:block w-full h-full object-cover"
                  loading="lazy"
                />
                <img
                  src={slide.mobileImageUrl}
                  alt={slide.title}
                  className="md:hidden w-full h-full object-cover"
                  loading="lazy"
                />
              </>
            ) : (
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"
              style={{ backgroundColor: slide.overlayColor || undefined }}
            />
          </motion.div>

          {/* Content */}
          <Container>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-8 md:py-12">
              {/* Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-white space-y-6 max-w-2xl"
              >
                {slide.badgeText && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border"
                    style={{
                      backgroundColor: slide.badgeColor || '#c9a84c',
                      color: slide.textColor || '#1a1a2e',
                      borderColor: slide.badgeColor || '#c9a84c',
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      {slide.badgeText}
                    </span>
                  </motion.div>
                )}

                {slide.subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm md:text-base uppercase tracking-widest text-[#c9a84c] font-semibold"
                  >
                    {slide.subtitle}
                  </motion.p>
                )}

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {slide.title}
                </motion.h1>

                {slide.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-white/90 text-lg md:text-xl leading-relaxed"
                  >
                    {slide.description}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-wrap gap-4 pt-4"
                >
                  <Link
                    href={slide.ctaLink}
                    className="group relative bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#1a1a2e] px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-[#c9a84c]/50 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {slide.ctaText}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                  {slide.secondaryCtaText && slide.secondaryCtaLink && (
                    <Link
                      href={slide.secondaryCtaLink}
                      className="group border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                    >
                      {slide.secondaryCtaText}
                    </Link>
                  )}
                </motion.div>
              </motion.div>

              {/* Product Image with 3D Effect */}
              {slide.productImageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="flex justify-center lg:justify-end perspective-1000"
                >
                  <motion.div
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <img
                      src={slide.productImageUrl}
                      alt={slide.title}
                      className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain drop-shadow-2xl"
                      loading="lazy"
                    />
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#c9a84c]/30 via-transparent to-transparent blur-3xl -z-10" />
                  </motion.div>
                </motion.div>
              )}
            </div>
          </Container>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          {/* Modern Arrow Buttons */}
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => paginate(-1)}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-4 rounded-full transition-all duration-300 border border-white/20 hover:border-white/40 shadow-xl"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => paginate(1)}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-4 rounded-full transition-all duration-300 border border-white/20 hover:border-white/40 shadow-xl"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>

          {/* Play/Pause Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPaused(!isPaused)}
            className="absolute bottom-24 right-6 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 border border-white/20 hover:border-white/40 shadow-xl"
            aria-label={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </motion.button>

          {/* Modern Slide Indicators with Progress */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
            {slides.map((_, index) => (
              <button
                key={index}
                className="group relative"
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === slideIndex ? 'true' : 'false'}
              >
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === slideIndex
                      ? 'bg-white w-12'
                      : 'bg-white/40 hover:bg-white/60 w-2 group-hover:w-8'
                  }`}
                />
                {index === slideIndex && (
                  <motion.div
                    className="absolute top-0 left-0 h-2 bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Slide Counter */}
          <div className="absolute bottom-8 left-6 z-20 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-sm font-medium">
            <span className="text-[#c9a84c]">{slideIndex + 1}</span> / {slides.length}
          </div>
        </>
      )}

      {/* Decorative Gradient Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
    </div>
  )
}
