'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
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

// Animation variants - Dynamic based on motion type
const getSlideVariants = (motionType: string) => {
  const variants = {
    slide: {
      enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95,
      }),
      center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
      },
      exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95,
      }),
    },
    fade: {
      enter: () => ({
        opacity: 0,
        scale: 1,
      }),
      center: {
        zIndex: 1,
        opacity: 1,
        scale: 1,
      },
      exit: () => ({
        zIndex: 0,
        opacity: 0,
        scale: 1,
      }),
    },
    zoom: {
      enter: () => ({
        opacity: 0,
        scale: 0.5,
      }),
      center: {
        zIndex: 1,
        opacity: 1,
        scale: 1,
      },
      exit: () => ({
        zIndex: 0,
        opacity: 0,
        scale: 1.5,
      }),
    },
    flip: {
      enter: (direction: number) => ({
        rotateY: direction > 0 ? 90 : -90,
        opacity: 0,
        scale: 0.8,
      }),
      center: {
        zIndex: 1,
        rotateY: 0,
        opacity: 1,
        scale: 1,
      },
      exit: (direction: number) => ({
        zIndex: 0,
        rotateY: direction < 0 ? 90 : -90,
        opacity: 0,
        scale: 0.8,
      }),
    },
    rotate: {
      enter: (direction: number) => ({
        rotate: direction > 0 ? 180 : -180,
        opacity: 0,
        scale: 0.3,
      }),
      center: {
        zIndex: 1,
        rotate: 0,
        opacity: 1,
        scale: 1,
      },
      exit: (direction: number) => ({
        zIndex: 0,
        rotate: direction < 0 ? 180 : -180,
        opacity: 0,
        scale: 0.3,
      }),
    },
    scale: {
      enter: () => ({
        opacity: 0,
        scale: 0,
      }),
      center: {
        zIndex: 1,
        opacity: 1,
        scale: 1,
      },
      exit: () => ({
        zIndex: 0,
        opacity: 0,
        scale: 0,
      }),
    },
  }

  return variants[motionType as keyof typeof variants] || variants.slide
}

const contentVariants = {
  enter: {
    opacity: 0,
    y: 20,
  },
  center: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3,
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
  },
}

const itemVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
}

const swipeConfidenceThreshold = 10000
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity
}

export function HeroSlider() {
  const [[page, direction], setPage] = useState([0, 0])
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
  }

  const goToSlide = (index: number) => {
    const newDirection = index > slideIndex ? 1 : -1
    setPage([index, newDirection])
  }

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        paginate(-1)
      } else if (e.key === 'ArrowRight') {
        paginate(1)
      } else if (e.key === ' ') {
        e.preventDefault()
        setIsPaused(!isPaused)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPaused])

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#1a3a5c] to-[#2a4a6c] h-[calc(100vh-164px)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/50"
        >
          Loading...
        </motion.div>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <section className="relative bg-gradient-to-br from-[#1a1a2e] via-[#1a3a5c] to-[#2a4a6c] h-[calc(100vh-164px)] overflow-hidden flex items-center justify-center">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-8 md:py-12"
          >
            <div className="text-white space-y-6 z-10">
              <p className="text-[#c9a84c] text-sm uppercase tracking-widest font-medium">
                Welcome to
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                YIWU EXPRESS
              </h1>
              <p className="text-white/80 text-lg max-w-lg leading-relaxed">
                Your trusted partner for global trade and logistics solutions.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/products"
                  className="bg-[#c9a84c] text-[#1a1a2e] px-8 py-3 rounded-full font-semibold hover:bg-[#e8d48b] transition-all transform hover:scale-105 shadow-lg"
                >
                  EXPLORE PRODUCTS
                </Link>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    )
  }

  const slide = slides[slideIndex]
  const slideVariants = getSlideVariants(slide?.motionType || 'slide')

  return (
    <div
      className="relative overflow-hidden h-[calc(100vh-164px)] flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Hero slider"
      aria-live="polite"
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={page}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.4 },
            scale: { duration: 0.4 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }: PanInfo) => {
            const swipe = swipePower(offset.x, velocity.x)

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1)
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1)
            }
          }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            {slide.mobileImageUrl ? (
              <>
                <motion.img
                  src={slide.imageUrl}
                  alt={slide.title}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="hidden md:block w-full h-full object-cover"
                  loading="lazy"
                />
                <motion.img
                  src={slide.mobileImageUrl}
                  alt={slide.title}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="md:hidden w-full h-full object-cover"
                  loading="lazy"
                />
              </>
            ) : (
              <motion.img
                src={slide.imageUrl}
                alt={slide.title}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8 }}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
              style={{ backgroundColor: slide.overlayColor || 'rgba(26,58,92,0.6)' }}
            />
          </div>

          {/* Content */}
          <Container>
            <motion.div
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-8 md:py-12"
            >
              {/* Text Content */}
              <div className="text-white space-y-4 max-w-xl">
                {slide.badgeText && (
                  <motion.span
                    variants={itemVariants}
                    className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded"
                    style={{
                      backgroundColor: slide.badgeColor || '#c9a84c',
                      color: slide.textColor || '#1a1a2e'
                    }}
                  >
                    {slide.badgeText}
                  </motion.span>
                )}
                {slide.subtitle && (
                  <motion.p
                    variants={itemVariants}
                    className="text-sm uppercase tracking-widest text-white/80"
                  >
                    {slide.subtitle}
                  </motion.p>
                )}
                <motion.h1
                  variants={itemVariants}
                  className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
                >
                  {slide.title}
                </motion.h1>
                {slide.description && (
                  <motion.p
                    variants={itemVariants}
                    className="text-white/80 text-base md:text-lg"
                  >
                    {slide.description}
                  </motion.p>
                )}
                <motion.div
                  variants={itemVariants}
                  className="flex flex-wrap gap-4 pt-2"
                >
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
                </motion.div>
              </div>

              {/* Product Image */}
              {slide.productImageUrl && (
                <motion.div
                  variants={itemVariants}
                  className="flex justify-center lg:justify-end"
                >
                  <motion.img
                    src={slide.productImageUrl}
                    alt={slide.title}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-contain"
                    loading="lazy"
                  />
                </motion.div>
              )}
            </motion.div>
          </Container>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          {/* Arrow Buttons */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>

          {/* Play/Pause Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPaused(!isPaused)}
            className="absolute bottom-20 left-4 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition backdrop-blur-sm"
            aria-label={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </motion.button>

          {/* Slide Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
            {slides.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`h-3 rounded-full transition-all ${
                  index === slideIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/70 w-3'
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === slideIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
