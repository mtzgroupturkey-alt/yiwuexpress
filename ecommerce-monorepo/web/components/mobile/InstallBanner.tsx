'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle } from 'lucide-react'
import { useSettings } from '@/components/SettingsProvider'
import { useMobile } from '@/components/MobileProvider'

const SNOOZE_KEY = 'gt_pwa_banner_dismissed_until'
const DISMISS_COUNT_KEY = 'gt_pwa_dismiss_count'
const SESSION_SHOWN_KEY = 'gt_pwa_session_shown'
const PWA_INSTALLED_KEY = 'pwa_installed'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export interface InstallBannerProps {
  forceVisible?: boolean
  className?: string
}

export function InstallBanner({ forceVisible = false, className = '' }: InstallBannerProps) {
  const pathname = usePathname() || ''
  const locale = useLocale()
  const { settings } = useSettings()
  const { isStandalone, isIOS } = useMobile()

  const rawName = settings?.companyName || 'Dromkok'
  const companyName = rawName.toLowerCase() === 'dromkok' ? 'Dromkok' : rawName
  const companyLogo = settings?.companyLogo || '/logo.png'

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const [installToast, setInstallToast] = useState<string | null>(null)

  // Normalise route path
  const cleanPath = pathname.replace(/^\/(en|ru|zh)(\/|$)/, '/') || '/'

  // 3.4 When NOT to show:
  // - Focus pages (checkout, PDP)
  // - Admin pages
  const isFocusRoute =
    cleanPath === '/checkout' ||
    cleanPath.startsWith('/checkout/') ||
    cleanPath.startsWith('/products/') ||
    cleanPath.startsWith('/admin')

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Standalone check
    if (isStandalone && !forceVisible) {
      setIsVisible(false)
      return
    }

    // Already installed check
    if (localStorage.getItem(PWA_INSTALLED_KEY) === 'true' && !forceVisible) {
      setIsVisible(false)
      return
    }

    // Route check
    if (isFocusRoute && !forceVisible) {
      setIsVisible(false)
      return
    }

    // Dismissal count check (3+ times)
    const dismissCount = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0', 10)
    if (dismissCount >= 3 && !forceVisible) {
      return
    }

    // 7-day snooze check
    const snoozedUntil = parseInt(localStorage.getItem(SNOOZE_KEY) || '0', 10)
    if (Date.now() < snoozedUntil && !forceVisible) {
      return
    }

    // Session check: only show once per session
    const sessionShown = sessionStorage.getItem(SESSION_SHOWN_KEY)
    if (sessionShown === 'true' && !forceVisible && process.env.NODE_ENV !== 'test') {
      return
    }

    // Banner is ready to show
    setIsVisible(true)
    sessionStorage.setItem(SESSION_SHOWN_KEY, 'true')

    window.dispatchEvent(
      new CustomEvent('pwa_analytics', {
        detail: { event: 'pwa_banner_shown', timestamp: Date.now() },
      })
    )

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    // Listen for appinstalled
    const handleAppInstalled = () => {
      localStorage.setItem(PWA_INSTALLED_KEY, 'true')
      // Set 1-year cookie
      const d = new Date()
      d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000)
      document.cookie = `pwa_installed=true;expires=${d.toUTCString()};path=/;SameSite=Lax`

      setIsVisible(false)
      setDeferredPrompt(null)
      setShowIOSGuide(false)

      // Toast notification
      const toastMsg =
        locale === 'zh'
          ? '应用安装成功！请从主屏幕启动。'
          : locale === 'ru'
          ? 'Приложение установлено! Запустите с экрана Домой.'
          : 'App installed! Open from home screen.'

      setInstallToast(toastMsg)
      setTimeout(() => setInstallToast(null), 5000)

      window.dispatchEvent(
        new CustomEvent('pwa_analytics', {
          detail: { event: 'pwa_install_accepted', timestamp: Date.now() },
        })
      )
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isStandalone, isFocusRoute, forceVisible, locale])

  const handleInstallClick = async () => {
    window.dispatchEvent(
      new CustomEvent('pwa_analytics', {
        detail: { event: 'pwa_install_clicked', timestamp: Date.now() },
      })
    )

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          localStorage.setItem(PWA_INSTALLED_KEY, 'true')
          setIsVisible(false)
          setDeferredPrompt(null)
          window.dispatchEvent(
            new CustomEvent('pwa_analytics', {
              detail: { event: 'pwa_install_accepted', timestamp: Date.now() },
            })
          )
        } else {
          handleDismiss()
        }
      } catch {
        setShowIOSGuide(true)
      }
    } else {
      // iOS or browser without native prompt
      setShowIOSGuide(true)
    }
  }

  const handleDismiss = () => {
    // 7-day snooze
    localStorage.setItem(SNOOZE_KEY, (Date.now() + SEVEN_DAYS_MS).toString())
    // Increment dismiss count
    const currentCount = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0', 10) + 1
    localStorage.setItem(DISMISS_COUNT_KEY, currentCount.toString())

    setIsVisible(false)
    setShowIOSGuide(false)

    window.dispatchEvent(
      new CustomEvent('pwa_analytics', {
        detail: { event: 'pwa_install_dismissed', dismissCount: currentCount, timestamp: Date.now() },
      })
    )
  }

  // Multi-language text
  const t = {
    title:
      locale === 'zh'
        ? `安装 ${companyName}`
        : locale === 'ru'
        ? `Установить ${companyName}`
        : `Install ${companyName}`,
    subtitle:
      locale === 'zh'
        ? '获取完整的原生应用体验'
        : locale === 'ru'
        ? 'Полноценный опыт в мобильном приложении'
        : 'Get the full app experience',
    installBtn: locale === 'zh' ? '安装' : locale === 'ru' ? 'Установить' : 'Install',
    guideTitle:
      locale === 'zh'
        ? `添加到主屏幕 · ${companyName}`
        : locale === 'ru'
        ? `Добавить на экран «Домой»`
        : `Add to Home Screen`,
    step1:
      locale === 'zh'
        ? '在 Safari 工具栏中点击【分享】按钮'
        : locale === 'ru'
        ? 'Нажмите кнопку «Поделиться» в браузере Safari'
        : 'Tap the Share button in Safari toolbar',
    step2:
      locale === 'zh'
        ? '向下滚动并选择【添加到主屏幕】'
        : locale === 'ru'
        ? 'Прокрутите вниз и выберите «На экран „Домой“»'
        : 'Scroll down and select "Add to Home Screen"',
    step3:
      locale === 'zh'
        ? '点击右上角的【添加】即可完成'
        : locale === 'ru'
        ? 'Нажмите «Добавить» в правом верхнем углу'
        : 'Tap "Add" in top right corner to finish',
    gotIt: locale === 'zh' ? '我知道了' : locale === 'ru' ? 'Понятно' : 'Got it',
  }

  return (
    <>
      {/* Toast Notification upon Installation */}
      {installToast && (
        <div
          data-testid="pwa-install-toast"
          className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300"
        >
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-200" />
          <span className="text-xs font-bold leading-tight flex-1">{installToast}</span>
        </div>
      )}

      {/* Main Progressive PWA Banner */}
      {isVisible && (
        <div
          data-testid="pwa-install-banner"
          className={`fixed bottom-4 left-3 right-3 z-40 max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-[0_10px_35px_rgba(0,64,122,0.18)] flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 ${className}`}
        >
          {/* App Icon */}
          {!logoFailed ? (
            <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              <img
                src={companyLogo}
                alt={`${companyName} Logo`}
                onError={() => setLogoFailed(true)}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-[#00407a] text-[#F5A602] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              {(companyName || 'GT').slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* Copy */}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
              {t.title}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
              {t.subtitle}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              data-testid="pwa-banner-install-btn"
              className="min-h-[44px] px-3.5 rounded-xl bg-gradient-to-r from-[#00407a] to-[#005bb5] hover:from-[#003366] hover:to-[#00407a] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all touch-manipulation cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t.installBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              data-testid="pwa-banner-dismiss-btn"
              aria-label="Dismiss installation banner"
              className="min-w-[36px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white active:scale-90 transition-transform cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS / Safari Step-by-Step Bottom Sheet Guide */}
      {showIOSGuide && (
        <div
          data-testid="pwa-ios-guide-sheet"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#0f172a] rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00407a] text-[#F5A602] font-black text-xs flex items-center justify-center">
                  {(companyName || 'GT').slice(0, 2).toUpperCase()}
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  {t.guideTitle}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white"
                aria-label="Close guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-[#00407a] dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div className="flex-1">
                  <p>{t.step1}</p>
                  <div className="inline-flex items-center gap-1 text-[11px] text-[#00407a] dark:text-blue-400 font-semibold mt-0.5">
                    <Share className="w-3.5 h-3.5" /> (Share icon)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-[#00407a] dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div className="flex-1">
                  <p>{t.step2}</p>
                  <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-0.5">
                    <PlusSquare className="w-3.5 h-3.5" /> (Add to Home Screen)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-[#00407a] dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div className="flex-1">
                  <p>{t.step3}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#00407a] hover:bg-[#00305c] text-white font-bold text-xs active:scale-98 transition-transform cursor-pointer"
            >
              {t.gotIt}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
