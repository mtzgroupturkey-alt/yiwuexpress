'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { adminMessages, type AdminLocale, type AdminDictionary } from '@/messages/admin'

export interface SupportedLocaleOption {
  code: AdminLocale
  label: string
  nativeName: string
  flag: string
}

export const SUPPORTED_ADMIN_LOCALES: SupportedLocaleOption[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
]

interface AdminLocaleContextType {
  locale: AdminLocale
  setLocale: (locale: AdminLocale) => void
  t: (key: string, fallback?: string) => string
  dict: AdminDictionary
  supportedLocales: SupportedLocaleOption[]
}

const AdminLocaleContext = createContext<AdminLocaleContextType | undefined>(undefined)

function resolveDotPath(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined
  const parts = path.split('.')
  let curr = obj
  for (const part of parts) {
    if (curr == null || typeof curr !== 'object') return undefined
    curr = curr[part]
  }
  return typeof curr === 'string' ? curr : undefined
}

export function AdminLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>('en')
  const [mounted, setMounted] = useState(false)

  // Initialize from storage or cookie
  useEffect(() => {
    let initialLocale: AdminLocale = 'en'
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('admin_locale') as AdminLocale | null
        const cookieMatch = document.cookie.match(/(?:^|; )ADMIN_LOCALE=([^;]+)/)
        const nextCookieMatch = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
        const fromCookie = (cookieMatch?.[1] || nextCookieMatch?.[1]) as AdminLocale | null

        if (saved && (saved === 'en' || saved === 'ru' || saved === 'zh')) {
          initialLocale = saved
        } else if (fromCookie && (fromCookie === 'en' || fromCookie === 'ru' || fromCookie === 'zh')) {
          initialLocale = fromCookie
        }
      }
    } catch {
      // ignore
    }
    setLocaleState(initialLocale)
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: AdminLocale) => {
    setLocaleState(newLocale)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_locale', newLocale)
        document.cookie = `ADMIN_LOCALE=${newLocale}; path=/; max-age=31536000; samesite=lax`
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; samesite=lax`
        document.documentElement.lang = newLocale
      }
    } catch {
      // ignore
    }
  }, [])

  const dict = adminMessages[locale] || adminMessages.en

  const t = useCallback(
    (key: string, fallback?: string): string => {
      // 1. Check in active locale
      const activeVal = resolveDotPath(dict, key)
      if (activeVal) return activeVal

      // 2. Check in English fallback
      const fallbackVal = resolveDotPath(adminMessages.en, key)
      if (fallbackVal) return fallbackVal

      // 3. Check status if key is a status code
      const statusVal = dict.status?.[key as keyof typeof dict.status]
      if (statusVal) return statusVal

      // 4. Return provided fallback or last segment of key
      if (fallback !== undefined) return fallback
      const segments = key.split('.')
      return segments[segments.length - 1]
    },
    [dict]
  )

  return (
    <AdminLocaleContext.Provider
      value={{
        locale,
        setLocale,
        t,
        dict,
        supportedLocales: SUPPORTED_ADMIN_LOCALES,
      }}
    >
      {children}
    </AdminLocaleContext.Provider>
  )
}

export function useAdminLocale(): AdminLocaleContextType {
  const ctx = useContext(AdminLocaleContext)
  if (!ctx) {
    // Graceful fallback outside provider
    return {
      locale: 'en',
      setLocale: () => {},
      t: (key: string, fallback?: string) => fallback || key,
      dict: adminMessages.en,
      supportedLocales: SUPPORTED_ADMIN_LOCALES,
    }
  }
  return ctx
}
