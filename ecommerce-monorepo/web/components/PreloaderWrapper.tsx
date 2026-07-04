'use client'

import { useState, useCallback, useEffect } from 'react'
import { Preloader } from '@/components/ui/Preloader'

export function PreloaderWrapper({ children }: { children: React.ReactNode }) {
  const [showPreloader, setShowPreloader] = useState(true)

  const handleComplete = useCallback(() => {
    setShowPreloader(false)
  }, [])

  return (
    <>
      {showPreloader && <Preloader onComplete={handleComplete} />}
      <div style={{ opacity: showPreloader ? 0 : 1, transition: 'opacity 0.3s ease' }}>
        {children}
      </div>
    </>
  )
}