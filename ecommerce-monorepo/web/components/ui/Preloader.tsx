'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { DEFAULT_COMPANY_NAME } from '@/lib/company'

interface PreloaderProps {
  onComplete?: () => void
  minDuration?: number // Minimum time to show preloader (ms)
  maxDuration?: number // Maximum time before auto-hide (ms)
  initialLogo?: string | null
  initialCompanyName?: string | null
}

export function Preloader({ 
  onComplete, 
  minDuration = 900, 
  maxDuration = 4000,
  initialLogo,
  initialCompanyName
}: PreloaderProps) {
  const t = useTranslations('Common')
  const locale = useLocale()
  
  const [logoUrl, setLogoUrl] = useState(initialLogo || '/logo.png')
  const [companyName, setCompanyName] = useState(initialCompanyName || DEFAULT_COMPANY_NAME)
  const [progress, setProgress] = useState(12)

  // Status subtitle based on progress & locale
  const statusMessage = useMemo(() => {
    if (progress < 40) {
      return locale === 'zh' ? '正在连接全球供应链...' : locale === 'ru' ? 'Подключение сервисов...' : 'Connecting global services...'
    }
    if (progress < 85) {
      return locale === 'zh' ? '加载产品与汇率数据...' : locale === 'ru' ? 'Загрузка каталога и курсов...' : 'Loading catalog & rates...'
    }
    return locale === 'zh' ? '准备就绪' : locale === 'ru' ? 'Готово к работе' : 'Ready'
  }, [progress, locale])

  // Fetch company settings if missing
  useEffect(() => {
    if (!initialLogo || !initialCompanyName) {
      fetch('/api/settings/public')
        .then(res => res.json())
        .then(data => {
          if (data?.settings) {
            if (data.settings.companyLogo && !initialLogo) {
              setLogoUrl(data.settings.companyLogo)
            }
            if (data.settings.companyName && !initialCompanyName) {
              setCompanyName(data.settings.companyName)
            }
          }
        })
        .catch(() => {})
    }
  }, [initialLogo, initialCompanyName])

  // Smooth progressive animation counter & load detection
  useEffect(() => {
    let current = 12
    const startTime = Date.now()
    let isWindowLoaded = document.readyState === 'complete'

    const onLoad = () => {
      isWindowLoaded = true
    }

    if (!isWindowLoaded) {
      window.addEventListener('load', onLoad)
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime

      if (isWindowLoaded && elapsed >= minDuration) {
        // Accelerate to 100%
        current = Math.min(100, current + Math.floor(Math.random() * 15) + 10)
      } else {
        // Smoothly approach 85-90%
        if (current < 85) {
          current += Math.floor(Math.random() * 4) + 2
        } else if (current < 92) {
          current += 1
        }
      }

      setProgress(current)

      if (current >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          onComplete?.()
        }, 180)
      }
    }, 45)

    // Failsafe timer
    const failsafe = setTimeout(() => {
      setProgress(100)
      clearInterval(interval)
      setTimeout(() => {
        onComplete?.()
      }, 150)
    }, maxDuration)

    return () => {
      clearInterval(interval)
      clearTimeout(failsafe)
      window.removeEventListener('load', onLoad)
    }
  }, [minDuration, maxDuration, onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.04,
        filter: 'blur(8px)',
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
      }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-[#071328] to-slate-950 text-white overflow-hidden select-none"
    >
      {/* Dynamic Background Ambient Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.15, 0.28, 0.15],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#00407a] blur-3xl"
        />
        <motion.div 
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.12, 0.22, 0.12],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#F5A602] blur-3xl"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.6)_100%)]" />
      </div>

      {/* Main Glass Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center max-w-sm w-full mx-4 px-8 py-10 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      >
        {/* Orbital Center Logo Container */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-6">
          {/* Outer Rotating Gradient Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#F5A602] border-r-[#38bdf8] opacity-80"
          />

          {/* Inner Counter-Rotating Dashed Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full border border-dashed border-white/20"
          />

          {/* Glowing Center Pulse */}
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-4 rounded-2xl bg-gradient-to-tr from-[#00407a]/40 to-[#F5A602]/20 blur-md"
          />

          {/* Logo or Brand Monogram */}
          <div className="relative z-10 w-20 h-20 rounded-2xl bg-slate-900/80 border border-white/15 flex items-center justify-center p-3 shadow-inner overflow-hidden">
            {logoUrl ? (
              <motion.img
                src={logoUrl}
                alt={companyName}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onError={() => setLogoUrl('')}
                className="w-full h-full object-contain filter brightness-110 drop-shadow-md"
              />
            ) : (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-black bg-gradient-to-br from-amber-300 via-amber-100 to-amber-500 bg-clip-text text-transparent"
              >
                {companyName.slice(0, 2).toUpperCase()}
              </motion.div>
            )}
          </div>
        </div>

        {/* Brand Name */}
        <motion.h2 
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-base sm:text-lg font-black tracking-widest text-center uppercase bg-gradient-to-r from-amber-100 via-white to-amber-200 bg-clip-text text-transparent mb-1"
        >
          {companyName}
        </motion.h2>

        {/* Animated Subtitle / Status */}
        <motion.div
          key={statusMessage}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-[11px] font-medium tracking-wider text-slate-400 uppercase text-center mb-6 h-4"
        >
          {statusMessage}
        </motion.div>

        {/* Progress Bar & Numerical Counter */}
        <div className="w-full">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 px-1">
            <span className="text-[10px] tracking-widest text-slate-500">{t('loading')}</span>
            <span className="font-mono text-amber-400 tabular-nums">{progress}%</span>
          </div>

          <div className="relative w-full h-2 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 p-[1px]">
            {/* Smooth Fill */}
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#00407a] via-[#F5A602] to-[#38bdf8] relative"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.1 }}
            >
              {/* Shimmer Light Bar */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
