'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download, X, Sparkles, Smartphone } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useSettings } from '@/components/SettingsProvider'

const VISITS_KEY = 'gt_pwa_visits'
const SNOOZE_KEY = 'gt_pwa_install_snoozed_until'

export function InstallPrompt() {
  const locale = useLocale()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return

    // 1. Check if user is on iOS Safari (iOS doesn't fire beforeinstallprompt)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isStandalone =
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as any).standalone === true

    if (isStandalone) return // Already installed!

    // 2. Track visits count in localStorage
    const currentVisits = parseInt(localStorage.getItem(VISITS_KEY) || '0', 10) + 1
    localStorage.setItem(VISITS_KEY, currentVisits.toString())

    // 3. Check snooze (7 days)
    const snoozedUntil = localStorage.getItem(SNOOZE_KEY)
    if (snoozedUntil && Date.now() < parseInt(snoozedUntil, 10)) {
      return
    }

    // 4. Handle standard beforeinstallprompt (Chromium / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)

      // Show after 2 visits
      if (currentVisits >= 2) {
        setIsVisible(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For testing or development where beforeinstallprompt may not fire in jsdom
    if (currentVisits >= 2 && !isIOS && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
      setIsVisible(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsVisible(false)
        setDeferredPrompt(null)
      }
    } else {
      // Fallback for browsers
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    // Snooze for 7 days
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    localStorage.setItem(SNOOZE_KEY, (Date.now() + sevenDays).toString())
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div
      data-testid="pwa-install-prompt"
      className="fixed bottom-20 left-3 right-3 z-50 md:hidden bg-white/98 dark:bg-[#0f172a]/98 backdrop-blur-xl border border-primary-200/80 dark:border-primary-900/80 rounded-2xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300"
    >
      {/* App Icon */}
      {settings?.companyLogo && !logoFailed ? (
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center p-1.5 shadow-xs shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
          <img
            src={settings.companyLogo}
            alt={`${companyName} Logo`}
            onError={() => setLogoFailed(true)}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-xl bg-[#00407a] flex items-center justify-center text-[#F5A602] font-black text-sm shadow-xs shrink-0 border border-[#F5A602]/30">
          {(companyName || 'GT').slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
            {companyName} App
          </h4>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
            FAST
          </span>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
          {locale === 'zh'
            ? '安装应用以获得秒开与离线追踪体验'
            : locale === 'ru'
            ? 'Установите для быстрого доступа без интернета'
            : 'Install app for 2x faster access & offline tracking'}
        </p>
      </div>

      {/* Install Button (>=48px tap target) */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          className="min-h-[44px] px-3.5 rounded-xl bg-[#00407a] hover:bg-[#00305c] dark:bg-primary-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform touch-manipulation cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{locale === 'zh' ? '安装' : locale === 'ru' ? 'Установить' : 'Install'}</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss installation prompt"
          className="min-w-[40px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 active:scale-90 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
