```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useKeyboard } from '../../hooks'

interface SliderProps {
  children: ReactNode[]
  className?: string
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function Slider({
  children,
  className = '',
  autoPlay = false,
  autoPlayInterval = 5000
}: SliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPresenting, setIsPresenting] = useState(false)

  const totalSlides = children.length

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  const exitPresentation = useCallback(() => {
    setIsPresenting(false)
  }, [])

  const togglePresentation = useCallback(() => {
    setIsPresenting(prev => !prev)
  }, [])

  const startPresentation = useCallback(() => {
    setIsPresenting(true)
    setCurrentSlide(0)
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || !isPresenting) return
    const timer = setInterval(nextSlide, autoPlayInterval)
    return () => clearInterval(timer)
  }, [autoPlay, autoPlayInterval, isPresenting, nextSlide])

  // Keyboard navigation
  useKeyboard({
    onNext: nextSlide,
    onPrev: prevSlide,
    onEscape: exitPresentation,
    onFullscreen: () => { },
    onTogglePresentation: togglePresentation,
    isPresenting,
  })

  // ========== LANDING PAGE MODE ==========
  if (!isPresenting) {
    return (
      <div className={`relative ${className} overflow-x-hidden overflow-y-auto`}>
        {/* Background gradient orbs */}
        <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>

        {/* Landing Content */}
        <div className="w-full min-h-screen py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl w-full mx-auto"
          >
            {/* Hero content here */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center"
            >
              <button
                onClick={startPresentation}
                className="px-8 py-4 bg-primary hover:bg-primary-light text-white font-semibold 
                           rounded-xl glow transition-all duration-300 flex items-center gap-3
                           text-lg cursor-pointer hover:scale-105"
              >
                <Play className="w-5 h-5" />
                Start
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* All Slides Content - Scrollable */}
        <div className="w-full">
          {children.map((child, index) => (
            <section
              key={index}
              className="min-h-screen w-full py-8 transform-gpu"
            >
              {child}
            </section>
          ))}
        </div>
      </div>
    )
  }

  // ========== PRESENTATION MODE ==========
  return (
    <div className={`fixed inset-0 z-50 bg-bg-base ${className}`}>
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/30 rounded-full blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/30 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Slides */}
      <div className="relative h-full flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full h-full"
          >
            {children[currentSlide]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
```
