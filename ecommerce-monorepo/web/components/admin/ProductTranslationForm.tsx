'use client'

import { useState } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { AutoTranslateButton } from '@/components/admin/AutoTranslateButton'

export type TranslationLocale = 'en' | 'ru' | 'zh'

export interface TranslationEntry {
  name: string
  description: string
}

export type TranslationPayload = Record<TranslationLocale, TranslationEntry>

export interface ProductTranslationFormProps {
  /** Initial values (e.g. when editing an existing product). */
  initialValues?: Partial<Record<TranslationLocale, Partial<TranslationEntry>>>
  /** Fired on every change with the full translations payload. */
  onChange?: (translations: TranslationPayload) => void
  /** Disable editing (e.g. while submitting). */
  disabled?: boolean
}

const LOCALES: {
  code: TranslationLocale
  label: string
  flag: string
  required: boolean
}[] = [
  { code: 'en', label: 'English', flag: '🇬🇧', required: true },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', required: false },
  { code: 'zh', label: '中文', flag: '🇨🇳', required: false }
]

const emptyEntry: TranslationEntry = { name: '', description: '' }

function buildInitial(
  initial?: Partial<Record<TranslationLocale, Partial<TranslationEntry>>>
): TranslationPayload {
  return LOCALES.reduce((acc, { code }) => {
    acc[code] = {
      name: initial?.[code]?.name ?? '',
      description: initial?.[code]?.description ?? ''
    }
    return acc
  }, {} as TranslationPayload)
}

export function ProductTranslationForm({
  initialValues,
  onChange,
  disabled = false
}: ProductTranslationFormProps) {
  const [activeTab, setActiveTab] = useState<TranslationLocale>('en')
  const [translations, setTranslations] = useState<TranslationPayload>(() =>
    buildInitial(initialValues)
  )
  const [touched, setTouched] = useState<Record<TranslationLocale, boolean>>({
    en: false,
    ru: false,
    zh: false
  })

  const update = (locale: TranslationLocale, field: keyof TranslationEntry, value: string) => {
    const next = {
      ...translations,
      [locale]: { ...translations[locale], [field]: value }
    }
    setTranslations(next)
    onChange?.(next)
  }

  const handleBlur = (locale: TranslationLocale) => {
    setTouched((t) => ({ ...t, [locale]: true }))
  }

  const enMissing = translations.en.name.trim().length === 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Auto-translate trigger */}
      <div className="flex items-center justify-end gap-2 border-b border-gray-200 px-3 py-2">
        <AutoTranslateButton
          enFields={{ name: translations.en.name, description: translations.en.description }}
          onTranslated={(result) => {
            const next = { ...translations }
            for (const locale of Object.keys(result)) {
              if (locale === 'en' || locale === 'ru' || locale === 'zh') {
                next[locale as TranslationLocale] = {
                  ...next[locale as TranslationLocale],
                  ...(result[locale] as Partial<TranslationEntry>),
                }
              }
            }
            setTranslations(next)
            onChange?.(next)
          }}
        />
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Product translations"
        className="flex flex-wrap gap-1 border-b border-gray-200 p-2"
      >
        {LOCALES.map(({ code, label, flag, required }) => {
          const isActive = activeTab === code
          const hasName = translations[code].name.trim().length > 0
          return (
            <button
              key={code}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => setActiveTab(code)}
              className={[
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-50',
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              ].join(' ')}
            >
              <span className="text-base leading-none" aria-hidden>
                {flag}
              </span>
              <span>{label}</span>
              <span
                className={[
                  'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  required
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-200 text-gray-600'
                ].join(' ')}
              >
                {code}
              </span>
              {hasName ? (
                <Check
                  className={isActive ? 'w-4 h-4 text-white' : 'w-4 h-4 text-green-600'}
                  aria-label="Translation filled"
                />
              ) : (
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"
                  aria-label="Translation pending"
                  title="Translation pending"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Active tab panel */}
      <div className="p-4 space-y-4" role="tabpanel">
        {LOCALES.filter((l) => l.code === activeTab).map(({ code, label, required }) => {
          const entry = translations[code]
          const showEnError = code === 'en' && touched.en && entry.name.trim().length === 0
          return (
            <div key={code} className="space-y-4">
              <div>
                <label
                  htmlFor={`translation-${code}-name`}
                  className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-800"
                >
                  <span className="text-base" aria-hidden>
                    {LOCALES.find((l) => l.code === code)?.flag}
                  </span>
                  {label} Name
                  {required ? (
                    <span className="text-red-600">*</span>
                  ) : (
                    <span className="text-xs font-normal text-gray-500">
                      (optional, recommended)
                    </span>
                  )}
                </label>
                <input
                  id={`translation-${code}-name`}
                  type="text"
                  value={entry.name}
                  disabled={disabled}
                  onChange={(e) => update(code, 'name', e.target.value)}
                  onBlur={() => handleBlur(code)}
                  placeholder={`Enter ${label} product name`}
                  className={[
                    'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2',
                    showEnError
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'
                  ].join(' ')}
                />
                {showEnError && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    English name is required before submitting.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`translation-${code}-description`}
                  className="mb-1.5 block text-sm font-semibold text-gray-800"
                >
                  {label} Description
                  {required && <span className="text-red-600"> *</span>}
                </label>
                <textarea
                  id={`translation-${code}-description`}
                  value={entry.description}
                  disabled={disabled}
                  rows={6}
                  onChange={(e) => update(code, 'description', e.target.value)}
                  placeholder={`Enter ${label} product description`}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Helper to validate a translations payload (en name required). */
export function validateTranslations(t: TranslationPayload): {
  valid: boolean
  error?: string
} {
  if (!t.en?.name?.trim()) {
    return { valid: false, error: 'English (EN) translation name is required.' }
  }
  return { valid: true }
}
