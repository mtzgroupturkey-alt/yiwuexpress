'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useMobile } from '@/components/MobileProvider'

export function BackToTop() {
  const locale = useLocale()
  const { isStandalone } = useMobile()
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  const tooltipText = locale === 'zh' ? '回到顶部' : locale === 'ru' ? 'Наверх' : 'Back to Top'

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const currentScroll = window.scrollY
      
      if (totalHeight > 0) {
        setScrollProgress((currentScroll / totalHeight) * 100)
      }

      if (currentScroll > 320) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [isScrolling, setIsScrolling] = useState(false)

  const scrollToTop = () => {
    const startPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    if (startPosition <= 0 || isScrolling) return

    setIsScrolling(true)
    const duration = Math.min(850, Math.max(450, Math.sqrt(startPosition) * 22))
    let startTime: number | null = null

    const easeInOutCubic = (t: number) => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    const step = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const timeElapsed = currentTime - startTime
      const progress = Math.min(timeElapsed / duration, 1)
      const ease = easeInOutCubic(progress)

      const nextPos = Math.round(startPosition * (1 - ease))

      window.scrollTo(0, nextPos)
      if (document.documentElement) document.documentElement.scrollTop = nextPos
      if (document.body) document.body.scrollTop = nextPos

      if (timeElapsed < duration) {
        requestAnimationFrame(step)
      } else {
        window.scrollTo(0, 0)
        if (document.documentElement) document.documentElement.scrollTop = 0
        if (document.body) document.body.scrollTop = 0
        setIsScrolling(false)
      }
    }

    requestAnimationFrame(step)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed ${isStandalone ? 'bottom-[6.5rem]' : 'bottom-6'} right-4 z-40 md:bottom-8 md:right-8`}
        >
          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.92 }}
            aria-label={tooltipText}
            className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#1a3a5c] text-white shadow-xl hover:shadow-2xl hover:shadow-amber-500/25 transition-shadow duration-300 border-2 border-[#c9a84c]/60 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:ring-offset-2 cursor-pointer"
          >
            {/* Circular Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2.5"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#c9a84c"
                strokeWidth="2.5"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * scrollProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-150"
              />
            </svg>

            {/* Icon */}
            <motion.div
              animate={isScrolling ? { y: [-1, -6, -1] } : { y: 0 }}
              transition={isScrolling ? { duration: 0.3, repeat: Infinity, ease: 'easeInOut' } : undefined}
            >
              <ArrowUp className="w-5 h-5 text-amber-300 group-hover:text-white transition-colors duration-200 group-hover:-translate-y-0.5 transform transition-transform" />
            </motion.div>

            {/* Hover Tooltip */}
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
              {tooltipText}
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
