'use client'

import React, { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { Globe, X, Check } from 'lucide-react'
import { setCookie, getCookie, switchLocale } from '@/lib/locale-navigation'
import { useCurrency } from '@/hooks/useCurrency'

const DISMISS_KEY = 'gt_locale_autodetect_dismissed'

export function LocaleCurrencyAutoDetect() {
  const currentLocale = useLocale()
  const pathname = usePathname() || ''
  const { setCurrency } = useCurrency()

  const [suggestion, setSuggestion] = useState<{
    targetLocale: string
    targetCurrency: string
    languageName: string
    flag: string
    message: string
    acceptLabel: string
    dismissLabel: string
  } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Don't prompt if user already explicitly set preferences or dismissed
    const hasDismissed = localStorage.getItem(DISMISS_KEY) || getCookie(DISMISS_KEY)
    const hasLocaleCookie = getCookie('NEXT_LOCALE')
    if (hasDismissed || hasLocaleCookie) {
      return
    }

    const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase()

    if ((browserLang.startsWith('ru') || browserLang.includes('ru')) && currentLocale !== 'ru') {
      setSuggestion({
        targetLocale: 'ru',
        targetCurrency: 'RUB',
        languageName: 'Русский',
        flag: '🇷🇺',
        message: 'Мы заметили, что ваш язык — русский. Хотите переключить интерфейс на русский язык и цены в рубли (RUB)?',
        acceptLabel: 'Переключить на Русский (RUB)',
        dismissLabel: 'Оставить English',
      })
    } else if ((browserLang.startsWith('zh') || browserLang.includes('zh')) && currentLocale !== 'zh') {
      setSuggestion({
        targetLocale: 'zh',
        targetCurrency: 'CNY',
        languageName: '中文',
        flag: '🇨🇳',
        message: '检测到您的系统语言为中文。是否将界面切换为中文，并使用人民币 (CNY) 显示价格？',
        acceptLabel: '切换为中文 (CNY)',
        dismissLabel: '保持当前语言',
      })
    }
  }, [currentLocale])

  if (!suggestion) return null

  const handleAccept = () => {
    try {
      localStorage.setItem(DISMISS_KEY, 'true')
    } catch {}
    setCookie(DISMISS_KEY, 'true', 365)
    setCurrency(suggestion.targetCurrency)
    switchLocale(suggestion.targetLocale, currentLocale, pathname)
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, 'true')
    } catch {}
    setCookie(DISMISS_KEY, 'true', 365)
    setSuggestion(null)
  }

  return (
    <div
      data-testid="locale-autodetect-banner"
      className="fixed top-0 inset-x-0 z-[100] bg-[#00407a] text-white px-4 py-2.5 shadow-md animate-in slide-in-from-top duration-300 border-b border-blue-400/30"
    >
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <span className="text-lg leading-none">{suggestion.flag}</span>
          <p className="font-medium text-blue-50">
            {suggestion.message}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAccept}
            className="min-h-[36px] px-3.5 rounded-lg bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-sm"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{suggestion.acceptLabel}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[36px] px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer active:scale-95"
          >
            <span>{suggestion.dismissLabel}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss language suggestion"
            className="p-1.5 text-blue-200 hover:text-white rounded-md cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
