'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8"
        >
          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Back to top"
            className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#1a3a5c] text-white shadow-xl hover:shadow-2xl hover:shadow-amber-500/25 transition-shadow duration-300 border-2 border-[#c9a84c]/60 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:ring-offset-2"
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
            <ArrowUp className="w-5 h-5 text-amber-300 group-hover:text-white transition-colors duration-200 group-hover:-translate-y-0.5 transform transition-transform" />

            {/* Hover Tooltip */}
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
              Back to Top
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
