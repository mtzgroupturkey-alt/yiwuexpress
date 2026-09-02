'use client'

import { useState, useCallback, useEffect } from 'react'
import { Preloader } from '@/components/ui/Preloader'

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
      {showPreloader && (
        <Preloader 
          onComplete={handleComplete} 
          initialLogo={initialLogo}
          initialCompanyName={initialCompanyName}
        />
      )}
      <div style={{ opacity: showPreloader ? 0 : 1, transition: 'opacity 0.3s ease' }}>
        {children}
      </div>
    </>
  )
}