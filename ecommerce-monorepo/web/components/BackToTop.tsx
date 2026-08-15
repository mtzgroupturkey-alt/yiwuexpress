'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Check if we're near the footer (check if footer exists and is in viewport)
      const footer = document.querySelector('footer')
      if (!footer) {
        // Fallback: show after 500px scroll if no footer found
        setIsVisible(window.pageYOffset > 500)
        return
      }

      const footerPosition = footer.getBoundingClientRect().top
      const windowHeight = window.innerHeight
      
      // Show button when footer is visible or about to be visible (within 200px)
      if (footerPosition <= windowHeight + 200) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    // Add scroll event listener
    window.addEventListener('scroll', toggleVisibility)
    // Check on mount
    toggleVisibility()

    // Cleanup
    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 group"
          aria-label="Back to top"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a5c] to-[#2c5282] rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300 animate-pulse"></div>
          
          {/* Main button with strong border for visibility on white */}
          <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1a3a5c] via-[#2c5282] to-[#1e4976] text-white rounded-2xl shadow-[0_8px_32px_rgba(26,58,92,0.4)] hover:shadow-[0_12px_48px_rgba(26,58,92,0.6)] border-2 border-white/20 hover:border-white/30 transform hover:scale-110 hover:-translate-y-2 transition-all duration-300">
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/10 rounded-2xl"></div>
            
            {/* Icon */}
            <ArrowUp 
              size={28} 
              className="relative z-10 transform group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-lg" 
              strokeWidth={2.5}
            />
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl transform -translate-x-full group-hover:translate-x-full"></div>
          </div>

          {/* Tooltip with better contrast */}
          <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-xl border border-gray-700">
            Back to top
            <div className="absolute top-full right-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>

          {/* Decorative ring on hover */}
          <div className="absolute inset-0 rounded-2xl border-2 border-[#c9a84c] opacity-0 group-hover:opacity-100 scale-100 group-hover:scale-125 transition-all duration-500"></div>
        </button>
      )}
    </>
  )
}
