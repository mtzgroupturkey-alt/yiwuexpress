'use client'

import { useState, useCallback } from 'react'
import { Preloader } from '@/components/ui/Preloader'
import { motion, AnimatePresence } from 'framer-motion'

interface PreloaderWrapperProps {
  children: React.ReactNode
  initialLogo?: string | null
  initialCompanyName?: string | null
}

export function PreloaderWrapper({ 
  children,
  initialLogo,
  initialCompanyName
}: PreloaderWrapperProps) {
  const [showPreloader, setShowPreloader] = useState(true)

  const handleComplete = useCallback(() => {
    setShowPreloader(false)
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        {showPreloader && (
          <Preloader 
            key="app-preloader"
            onComplete={handleComplete} 
            initialLogo={initialLogo}
            initialCompanyName={initialCompanyName}
          />
        )}
      </AnimatePresence>
      <motion.div 
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full min-h-screen"
      >
        {children}
      </motion.div>
    </>
  )
}