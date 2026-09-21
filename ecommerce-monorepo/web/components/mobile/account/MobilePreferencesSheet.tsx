'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Globe, Coins, Check, ArrowRight } from 'lucide-react'
import { BottomSheet } from '../BottomSheet'
import { useCurrency, type CurrencyItem } from '@/hooks/useCurrency'

export interface MobilePreferencesSheetProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'language' | 'currency'
}

const LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'ru', label: 'Русский', nativeName: 'Русский (RU)', flag: '🇷🇺' },
  { code: 'zh', label: '中文', nativeName: '简体中文 (CN)', flag: '🇨🇳' },
]

export function MobilePreferencesSheet({
  isOpen,
  onClose,
  initialTab = 'language',
}: MobilePreferencesSheetProps) {
  const router = useRouter()
  const pathname = usePathname() || ''
  const locale = useLocale()
  const { currency, setCurrency, currencies } = useCurrency()

  const [activeTab, setActiveTab] = useState<'language' | 'currency'>(initialTab)

  const handleLanguageChange = (targetLocale: string) => {
    if (targetLocale === locale) {
      onClose()
      return
    }

    // Replace current locale prefix with new locale
    const segments = pathname.split('/')
    if (segments.length > 1 && ['en', 'ru', 'zh'].includes(segments[1])) {
      segments[1] = targetLocale
    } else {
      segments.splice(1, 0, targetLocale)
    }
    const newPath = segments.join('/') || `/${targetLocale}`
    router.push(newPath)
    onClose()
  }

  const handleCurrencyChange = (currCode: string) => {
    setCurrency(currCode)
    onClose()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={locale === 'zh' ? '语言与货币偏好' : locale === 'ru' ? 'Язык и валюта' : 'Language & Currency'}
      subtitle={
        locale === 'zh'
          ? '定制您的多语言界面与结算货币'
          : locale === 'ru'
          ? 'Выберите язык интерфейса и валюту цен'
          : 'Choose your browsing language and display currency'
      }
    >
      <div data-testid="mobile-preferences-sheet" className="p-4 space-y-4">
        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('language')}
            className={`flex-1 min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'language'
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{locale === 'zh' ? '界面语言' : locale === 'ru' ? 'Язык' : 'Language'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('currency')}
            className={`flex-1 min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'currency'
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>{locale === 'zh' ? '结算货币' : locale === 'ru' ? 'Валюта' : 'Currency'}</span>
          </button>
        </div>

        {/* Tab Content: Language */}
        {activeTab === 'language' && (
          <div className="space-y-2 pt-1">
            {LANGUAGES.map((lang) => {
              const isSelected = locale === lang.code

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full min-h-[52px] p-3.5 rounded-xl border flex items-center justify-between text-left transition-all active:scale-98 touch-manipulation ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-600 text-primary-700 dark:text-primary-300 font-bold'
                      : 'bg-white dark:bg-[#0f172a] border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <div>
                      <span className="text-xs font-bold block">{lang.label}</span>
                      <span className="text-[11px] text-gray-400 dark:text-slate-400">{lang.nativeName}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Tab Content: Currency */}
        {activeTab === 'currency' && (
          <div className="space-y-2 pt-1 max-h-[50vh] overflow-y-auto no-scrollbar">
            {currencies && currencies.map((curr: CurrencyItem) => {
              const isSelected = currency === curr.code

              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => handleCurrencyChange(curr.code)}
                  className={`w-full min-h-[52px] p-3.5 rounded-xl border flex items-center justify-between text-left transition-all active:scale-98 touch-manipulation ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-600 text-primary-700 dark:text-primary-300 font-bold'
                      : 'bg-white dark:bg-[#0f172a] border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center justify-center font-mono font-bold text-xs">
                      {curr.symbol}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{curr.code}</span>
                      <span className="text-[11px] text-gray-400 dark:text-slate-400">{curr.name || curr.code}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
