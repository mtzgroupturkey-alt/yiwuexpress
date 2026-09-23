'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { switchLocale } from '@/lib/locale-navigation'

export interface LocaleOption {
  code: string
  label: string
  nativeLabel: string
  flag: string
  shortCode: string
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English (US)', flag: '🇺🇸', shortCode: 'EN' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺', shortCode: 'RU' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳', shortCode: 'ZH' },
]

interface LanguageSwitcherProps {
  variant?: 'header-dropdown' | 'footer-dropdown' | 'drawer-radio' | 'simple'
  className?: string
  onSelect?: (locale: string) => void
}

export function LanguageSwitcher({
  variant = 'header-dropdown',
  className = '',
  onSelect,
}: LanguageSwitcherProps) {
  const currentLocale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeLocaleObj =
    SUPPORTED_LOCALES.find((l) => l.code === currentLocale) || SUPPORTED_LOCALES[0]

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleChoose = (code: string) => {
    setIsOpen(false)
    if (onSelect) {
      onSelect(code)
    }
    switchLocale(code, currentLocale)
  }

  // 1. Mobile Drawer Radio List Variant (R2)
  if (variant === 'drawer-radio') {
    return (
      <div className={`space-y-1.5 ${className}`} data-testid="language-switcher-drawer">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 mb-1 px-1">
          <Globe className="w-4 h-4 text-[#00407a] dark:text-sky-400" />
          <span>{currentLocale === 'zh' ? '界面语言' : currentLocale === 'ru' ? 'Язык интерфейса' : 'Language'}</span>
        </div>
        <div className="space-y-1">
          {SUPPORTED_LOCALES.map((loc) => {
            const isSelected = currentLocale === loc.code
            return (
              <button
                key={loc.code}
                type="button"
                onClick={() => handleChoose(loc.code)}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all touch-manipulation text-left cursor-pointer active:scale-98 ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-sky-950/40 text-[#00407a] dark:text-sky-300 font-bold border border-blue-200 dark:border-sky-800/60'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Radio Indicator (● vs ○) */}
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-[#00407a] dark:border-sky-400'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-[#00407a] dark:bg-sky-400" />
                    )}
                  </div>
                  <span className="text-base leading-none">{loc.flag}</span>
                  <span>{loc.nativeLabel}</span>
                </div>
                {isSelected && (
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#00407a]/10 dark:bg-sky-400/20 text-[#00407a] dark:text-sky-300">
                    {loc.shortCode}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 2. Desktop Footer Dropdown Variant (R4)
  if (variant === 'footer-dropdown') {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Select Language"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 border border-slate-700/80 hover:border-slate-600 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{activeLocaleObj.flag}</span>
          <span className="uppercase font-bold tracking-wider">{activeLocaleObj.shortCode}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-44 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
              Select Language
            </div>
            {SUPPORTED_LOCALES.map((loc) => {
              const isSelected = currentLocale === loc.code
              return (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => handleChoose(loc.code)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 text-sky-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{loc.flag}</span>
                    <span>{loc.nativeLabel}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 stroke-[2.5]" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // 3. Desktop Header Dropdown Variant (R1 - Default)
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select Language"
        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/90 hover:border-slate-300 dark:border-slate-700 transition-colors font-semibold text-slate-700 dark:text-slate-200 text-xs shadow-2xs group"
      >
        <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-[#00407a] dark:group-hover:text-blue-400 transition-colors" />
        <span className="text-xs leading-none">{activeLocaleObj.flag}</span>
        <span className="uppercase font-bold tracking-tight text-slate-900 dark:text-white">
          {activeLocaleObj.shortCode}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          role="listbox"
          className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-44 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
        >
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {currentLocale === 'zh' ? '选择界面语言' : currentLocale === 'ru' ? 'Выберите язык' : 'Select Language'}
          </div>
          {SUPPORTED_LOCALES.map((loc) => {
            const isSelected = currentLocale === loc.code
            return (
              <button
                key={loc.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleChoose(loc.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#00407a] dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base">{loc.flag}</span>
                  <span>{loc.nativeLabel}</span>
                </span>
                {isSelected && <Check className="w-4 h-4 text-[#00407a] stroke-[2.5]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
