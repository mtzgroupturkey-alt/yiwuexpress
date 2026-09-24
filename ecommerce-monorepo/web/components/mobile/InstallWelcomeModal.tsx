'use client'

import React, { useState, useEffect } from 'react'
import { X, Zap, WifiOff, Bell, Maximize2, Download, ArrowRight } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useSettings } from '@/components/SettingsProvider'
import { useMobile } from '@/components/MobileProvider'

const WELCOME_CHOICE_KEY = 'gt_pwa_welcome_choice'
const WELCOME_CHOICE_DAYS = 30

interface InstallWelcomeModalProps {
  onInstallClick: () => void
  onDismiss?: () => void
}

export function InstallWelcomeModal({ onInstallClick, onDismiss }: InstallWelcomeModalProps) {
  const locale = useLocale()
  const { settings } = useSettings()
  const { isStandalone } = useMobile()
  const rawName = settings?.companyName || 'Dromkok'
  const companyName = rawName.toLowerCase() === 'dromkok' ? 'Dromkok' : rawName
  const companyLogo = settings?.companyLogo || '/logo.png'

  const [isOpen, setIsOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Never show if already installed in standalone mode
    if (isStandalone) return

    // 2. Check if choice already made in past 30 days
    const savedChoice = localStorage.getItem(WELCOME_CHOICE_KEY)
    if (savedChoice) return

    // 3. Show modal after 3 seconds delay for first-time visitors
    const timer = setTimeout(() => {
      setIsOpen(true)
      // Dispatch analytics event
      window.dispatchEvent(
        new CustomEvent('pwa_analytics', {
          detail: { event: 'pwa_welcome_shown', timestamp: Date.now() },
        })
      )
    }, 3000)

    return () => clearTimeout(timer)
  }, [isStandalone])

  const saveChoice = (choice: 'install' | 'browser') => {
    try {
      localStorage.setItem(WELCOME_CHOICE_KEY, choice)
      // Set cookie for 30 days
      const d = new Date()
      d.setTime(d.getTime() + WELCOME_CHOICE_DAYS * 24 * 60 * 60 * 1000)
      document.cookie = `${WELCOME_CHOICE_KEY}=${choice};expires=${d.toUTCString()};path=/;SameSite=Lax`
    } catch {
      // Ignore storage errors
    }
  }

  const handleInstall = () => {
    saveChoice('install')
    setIsOpen(false)
    window.dispatchEvent(
      new CustomEvent('pwa_analytics', {
        detail: { event: 'pwa_welcome_install_clicked', timestamp: Date.now() },
      })
    )
    onInstallClick()
  }

  const handleContinueInBrowser = () => {
    saveChoice('browser')
    setIsOpen(false)
    window.dispatchEvent(
      new CustomEvent('pwa_analytics', {
        detail: { event: 'pwa_welcome_continue_browser', timestamp: Date.now() },
      })
    )
    if (onDismiss) onDismiss()
  }

  if (!isOpen) return null

  // Translations
  const t = {
    welcome:
      locale === 'zh'
        ? `欢迎体验 ${companyName}`
        : locale === 'ru'
        ? `Добро пожаловать в ${companyName}`
        : `Welcome to ${companyName}`,
    subtitle:
      locale === 'zh'
        ? '安装我们的轻量应用，畅享更出色的跨境商贸体验：'
        : locale === 'ru'
        ? 'Установите приложение для максимального удобства:'
        : 'Install our app for the fastest sourcing experience:',
    b1Title: locale === 'zh' ? '更快的加载速度' : locale === 'ru' ? 'Быстрая загрузка' : 'Faster Loading',
    b1Desc: locale === 'zh' ? '即时响应，节省流量' : locale === 'ru' ? 'Мгновенный отклик' : 'Instant response & cached assets',
    b2Title: locale === 'zh' ? '离线访问能力' : locale === 'ru' ? 'Офлайн доступ' : 'Offline Access',
    b2Desc: locale === 'zh' ? '随时查看已浏览订单' : locale === 'ru' ? 'Просмотр истории заказов' : 'Browse saved quotes without internet',
    b3Title: locale === 'zh' ? '推送实时通知' : locale === 'ru' ? 'Push-уведомления' : 'Push Notifications',
    b3Desc: locale === 'zh' ? '物流变动与降价提醒' : locale === 'ru' ? 'Статусы грузов и скидки' : 'Real-time order & shipment updates',
    b4Title: locale === 'zh' ? '沉浸式全屏' : locale === 'ru' ? 'Полноэкранный режим' : 'Full-Screen Experience',
    b4Desc: locale === 'zh' ? '无地址栏遮挡，触控流畅' : locale === 'ru' ? 'Без рамок браузера' : 'No browser bar, native touch gesture',
    btnInstall: locale === 'zh' ? '立即安装' : locale === 'ru' ? 'Установить сейчас' : 'Install now',
    btnBrowser: locale === 'zh' ? '继续使用浏览器访问' : locale === 'ru' ? 'Продолжить в браузере' : 'Continue in browser',
  }

  return (
    <div
      data-testid="pwa-welcome-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300"
    >
      <div className="w-full max-w-sm bg-white dark:bg-[#0f172a] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Decorative Top Radial Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#00407a]/15 dark:bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleContinueInBrowser}
          aria-label="Close welcome modal"
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="flex items-center gap-3.5 pt-1">
          {!logoFailed ? (
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 p-2 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={companyLogo}
                alt={`${companyName} Logo`}
                onError={() => setLogoFailed(true)}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-[#00407a] text-[#F5A602] font-black text-base shadow-xs flex items-center justify-center shrink-0">
              {(companyName || 'GT').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-base text-gray-950 dark:text-white leading-snug">
              {t.welcome}
            </h3>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#00407a] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
              Official PWA App
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {t.subtitle}
        </p>

        {/* App Benefits List */}
        <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-gray-900 dark:text-white">{t.b1Title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.b1Desc}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-gray-900 dark:text-white">{t.b2Title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.b2Desc}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-gray-900 dark:text-white">{t.b3Title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.b3Desc}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-gray-900 dark:text-white">{t.b4Title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.b4Desc}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleInstall}
            className="w-full min-h-[48px] px-4 rounded-2xl bg-gradient-to-r from-[#00407a] to-[#005bb5] hover:from-[#003366] hover:to-[#00407a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all touch-manipulation cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{t.btnInstall}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70" />
          </button>

          <button
            type="button"
            onClick={handleContinueInBrowser}
            className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            {t.btnBrowser}
          </button>
        </div>
      </div>
    </div>
  )
}
