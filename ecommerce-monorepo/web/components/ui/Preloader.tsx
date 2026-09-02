'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface PreloaderProps {
  onComplete?: () => void
  minDuration?: number // Minimum time to show preloader (ms)
  maxDuration?: number // Maximum time before auto-hide (ms)
  initialLogo?: string | null
  initialCompanyName?: string | null
}

export function Preloader({ 
  onComplete, 
  minDuration = 800, 
  maxDuration = 4000,
  initialLogo,
  initialCompanyName
}: PreloaderProps) {
  const t = useTranslations('Common')
  const [isVisible, setIsVisible] = useState(true)
  const [logoUrl, setLogoUrl] = useState(initialLogo || '')
  const [companyName, setCompanyName] = useState(initialCompanyName || t('loading'))

  useEffect(() => {
    // If not provided on SSR, fetch company logo and name from database
    if (!initialLogo) {
      fetch('/api/settings/public')
        .then(res => res.json())
        .then(data => {
          if (data.settings) {
            if (data.settings.companyLogo) {
              setLogoUrl(data.settings.companyLogo)
            }
            if (data.settings.companyName) {
              setCompanyName(data.settings.companyName)
            }
          }
        })
        .catch(err => {
          console.error('Failed to load preloader settings:', err)
        })
    }
  }, [initialLogo])

  useEffect(() => {
    // Hide preloader on window load
    const handleLoad = () => {
      setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, minDuration)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
    }

    // Failsafe: hide after maxDuration
    const failsafeTimeout = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, maxDuration)

    return () => {
      window.removeEventListener('load', handleLoad)
      clearTimeout(failsafeTimeout)
    }
  }, [minDuration, maxDuration, onComplete])

  if (!isVisible) return null

  return (
    <div className="preloader-overlay">
      <div className="preloader-logo-wrap">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={companyName}
            className="preloader-logo"
          />
        ) : (
          <div className="logo-placeholder">
            {companyName.substring(0, 2).toUpperCase() || 'YE'}
          </div>
        )}
      </div>

      <div className="preloader-spinner">
        <div className="ring"></div>
        <div className="ring"></div>
        <div className="ring"></div>
      </div>

      <div className="preloader-text">{t('loading')}</div>

      <div className="preloader-progress">
        <div className="bar"></div>
      </div>
    </div>
  )
}
