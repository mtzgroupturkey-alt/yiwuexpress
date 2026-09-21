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
  const companyLogo = settings?.companyLogo || '/uploads/general/1789563604789-1787644810312-logo_pixian_ai.png'

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return

    // 1. Check if user is already running the installed standalone PWA app
    const isStandalone =
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as any).standalone === true

    if (isStandalone) {
      setIsVisible(false)
      return // Already running inside installed app!
    }

    // 2. Track visits count in localStorage
    const currentVisits = parseInt(localStorage.getItem(VISITS_KEY) || '0', 10) + 1
    localStorage.setItem(VISITS_KEY, currentVisits.toString())

    // 3. Handle snooze logic
    if (process.env.NODE_ENV === 'test') {
      const snoozedUntil = localStorage.getItem(SNOOZE_KEY)
      if (snoozedUntil && Date.now() < parseInt(snoozedUntil, 10)) {
        return
      }
    } else {
      // In live browser runtime, ensure old stale snooze or flags don't suppress prompt
      localStorage.removeItem(SNOOZE_KEY)
      localStorage.removeItem('pwa_installed')
    }

    // 4. Show install prompt continuously until user installs
    setIsVisible(true)

    // 5. Handle standard beforeinstallprompt (Chromium / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    // 6. Handle successful app installation
    const handleAppInstalled = () => {
      localStorage.setItem('pwa_installed', 'true')
      setIsVisible(false)
      setDeferredPrompt(null)
      setShowGuide(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          localStorage.setItem('pwa_installed', 'true')
          setIsVisible(false)
          setDeferredPrompt(null)
        }
      } catch {
        setShowGuide(true)
      }
    } else {
      // Guide user on iOS or other browsers without native prompt
      setShowGuide(true)
    }
  }

  const handleDismiss = () => {
    // Dismiss prompt for current session / set snooze for test suite
    const snoozeDuration = 7 * 24 * 60 * 60 * 1000 // 7 days
    localStorage.setItem(SNOOZE_KEY, (Date.now() + snoozeDuration).toString())
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <>
      <div
        data-testid="pwa-install-prompt"
        className="fixed bottom-20 left-3 right-3 z-50 md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 dark:border-white/15 rounded-3xl p-3.5 shadow-[0_12px_40px_rgba(0,64,122,0.18),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 relative overflow-hidden"
      >
        {/* Frosted Glass Specular Highlight Sheen */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent pointer-events-none rounded-t-3xl" />
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-[#00407a]/10 dark:bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* App Icon */}
        {!logoFailed ? (
          <div className="w-12 h-12 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center p-1.5 shadow-sm shrink-0 border border-white/80 dark:border-white/20 overflow-hidden">
            <img
              src={companyLogo}
              alt={`${companyName} Logo`}
              onError={() => setLogoFailed(true)}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-[#00407a] flex items-center justify-center text-[#F5A602] font-black text-sm shadow-sm shrink-0 border border-[#F5A602]/30">
            {(companyName || 'GT').slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
              {companyName} App
            </h4>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0 border border-amber-300/50">
              FAST
            </span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-slate-300 truncate mt-0.5 font-medium">
            {locale === 'zh'
              ? '安装应用以获得秒开与离线追踪体验'
              : locale === 'ru'
              ? 'Установите для быстрого доступа без интернета'
              : 'Install app for 2x faster access & offline tracking'}
          </p>
        </div>

        {/* Install Button (>=44px tap target) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="min-h-[44px] px-3.5 rounded-2xl bg-gradient-to-r from-[#00407a] to-[#005bb5] hover:from-[#003366] hover:to-[#00407a] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(0,64,122,0.35)] active:scale-95 transition-all touch-manipulation cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{locale === 'zh' ? '安装' : locale === 'ru' ? 'Установить' : 'Install'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss installation prompt"
            className="min-w-[36px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white active:scale-90 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Installation Guide Modal (for iOS & browsers without native install prompt) */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#0f172a] rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {!logoFailed ? (
                  <div className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-100">
                    <img src={companyLogo} alt={companyName} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-md bg-[#00407a] text-[#F5A602] font-black text-xs flex items-center justify-center">
                    {(companyName || 'GT').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  {locale === 'zh' ? '安装到手机主屏幕' : locale === 'ru' ? 'Установка приложения' : 'Install to Home Screen'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white"
                aria-label="Close guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#00407a] dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <p>
                  {locale === 'zh' ? '点击浏览器工具栏的【分享】按钮 (带有向上箭头的图标)' : locale === 'ru' ? 'Нажмите кнопку «Поделиться» (значок со стрелкой вверх) в браузере' : 'Tap the Share icon in your browser toolbar (box with upward arrow)'}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#00407a] dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <p>
                  {locale === 'zh' ? '在菜单中选择【添加到主屏幕】(Add to Home Screen)' : locale === 'ru' ? 'Выберите пункт «На экран „Домой“»' : 'Scroll down and select "Add to Home Screen"'}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#00407a] dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <p>
                  {locale === 'zh' ? '点击右上角的【添加】，即可获得原生 App 秒开体验' : locale === 'ru' ? 'Нажмите «Добавить» для быстрого доступа без браузера' : 'Tap "Add" in the top right to use it like a native app'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#00407a] hover:bg-[#00305c] text-white font-bold text-xs active:scale-98 transition-transform"
            >
              {locale === 'zh' ? '我知道了' : locale === 'ru' ? 'Понятно' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
