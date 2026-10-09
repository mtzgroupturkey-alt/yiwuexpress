'use client'

import { useState, useEffect } from 'react'
import { Check, AlertCircle, Info } from 'lucide-react'
import { AutoTranslateButton } from '@/components/admin/AutoTranslateButton'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'

export type TranslationLocale = 'en' | 'ru' | 'zh'

export interface TranslationEntry {
  name: string
  description: string
  metaTitle?: string
  metaDescription?: string
}

export type TranslationPayload = Record<TranslationLocale, TranslationEntry>

export interface ProductTranslationFormProps {
  /** Initial values (e.g. when editing an existing product). */
  initialValues?: Partial<Record<TranslationLocale, Partial<TranslationEntry>>>
  /** Fired on every change with the full translations payload. */
  onChange?: (translations: TranslationPayload) => void
  /** Extra dynamic attribute fields to translate (slug -> string value). */
  extraFieldsToTranslate?: Record<string, string>
  /** Fired when extra attribute fields are translated. */
  onAttributesTranslated?: (translatedAttrs: Record<string, Record<string, string>>) => void
  /** Disable editing (e.g. while submitting). */
  disabled?: boolean
  /** Sweden Name for product details identification */
  swedenName?: string
  onSwedenNameChange?: (value: string) => void
  /** Article # for IKEA / manufacturer identification */
  articleNumber?: string
  onArticleNumberChange?: (value: string) => void
  /** Dynamic Category-specific Attributes slot to render inside hero section */
  renderAttributes?: (currentLocale: TranslationLocale) => React.ReactNode
  attributesSlot?: React.ReactNode
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

const emptyEntry: TranslationEntry = { name: '', description: '', metaTitle: '', metaDescription: '' }

function buildInitial(
  initial?: Partial<Record<TranslationLocale, Partial<TranslationEntry>>>
): TranslationPayload {
  return LOCALES.reduce((acc, { code }) => {
    acc[code] = {
      name: initial?.[code]?.name ?? '',
      description: initial?.[code]?.description ?? '',
      metaTitle: initial?.[code]?.metaTitle ?? '',
      metaDescription: initial?.[code]?.metaDescription ?? ''
    }
    return acc
  }, {} as TranslationPayload)
}

export function ProductTranslationForm({
  initialValues,
  onChange,
  extraFieldsToTranslate,
  onAttributesTranslated,
  disabled = false,
  swedenName = '',
  onSwedenNameChange,
  articleNumber = '',
  onArticleNumberChange,
  renderAttributes,
  attributesSlot
}: ProductTranslationFormProps) {
  const { dict } = useAdminLocale()
  const [activeTab, setActiveTab] = useState<TranslationLocale>('en')
  const [translations, setTranslations] = useState<TranslationPayload>(() =>
    buildInitial(initialValues)
  )

  useEffect(() => {
    setTranslations(buildInitial(initialValues))
  }, [initialValues])
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
          sourceLocale={activeTab}
          allFields={{
            en: {
              name: translations.en.name,
              description: translations.en.description,
              metaTitle: translations.en.metaTitle || '',
              metaDescription: translations.en.metaDescription || '',
              ...(activeTab === 'en' && extraFieldsToTranslate ? extraFieldsToTranslate : {}),
            },
            ru: {
              name: translations.ru.name,
              description: translations.ru.description,
              metaTitle: translations.ru.metaTitle || '',
              metaDescription: translations.ru.metaDescription || '',
              ...(activeTab === 'ru' && extraFieldsToTranslate ? extraFieldsToTranslate : {}),
            },
            zh: {
              name: translations.zh.name,
              description: translations.zh.description,
              metaTitle: translations.zh.metaTitle || '',
              metaDescription: translations.zh.metaDescription || '',
              ...(activeTab === 'zh' && extraFieldsToTranslate ? extraFieldsToTranslate : {}),
            },
          }}
          onTranslated={(result) => {
            const next = { ...translations }
            const attrTranslations: Record<string, Record<string, string>> = {}

            for (const locale of Object.keys(result)) {
              if (locale === 'en' || locale === 'ru' || locale === 'zh') {
                const locResult = result[locale] || {}
                next[locale as TranslationLocale] = {
                  ...next[locale as TranslationLocale],
                  name: locResult.name ?? next[locale as TranslationLocale].name,
                  description: locResult.description ?? next[locale as TranslationLocale].description,
                  metaTitle: locResult.metaTitle ?? next[locale as TranslationLocale].metaTitle,
                  metaDescription: locResult.metaDescription ?? next[locale as TranslationLocale].metaDescription,
                }

                for (const [k, v] of Object.entries(locResult)) {
                  if (!['name', 'description', 'metaTitle', 'metaDescription'].includes(k)) {
                    if (!attrTranslations[k]) attrTranslations[k] = {}
                    attrTranslations[k][locale] = v
                  }
                }
              }
            }
            setTranslations(next)
            onChange?.(next)
            if (Object.keys(attrTranslations).length > 0) {
              onAttributesTranslated?.(attrTranslations)
            }
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
              {code === 'en' ? (
                /* English Tab: Integrated Product Details Information (Sweden Name, English Name, Article #) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Product Details Information
                      </label>
                      <span className="text-[10px] text-gray-400 font-normal">
                        (Hero Section)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Sweden Name */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Sweden Name
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">e.g. GULDÖRING</span>
                      </div>
                      <input
                        type="text"
                        value={swedenName}
                        disabled={disabled}
                        onChange={(e) => onSwedenNameChange?.(e.target.value)}
                        placeholder="e.g. GULDÖRING"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                      <p className="text-[11px] text-gray-500">Original Swedish series / brand name</p>
                    </div>

                    {/* English Name (Single Product Name) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="translation-en-name" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          English Name <span className="text-red-600">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">e.g. 7-piece cookware set</span>
                      </div>
                      <input
                        id="translation-en-name"
                        type="text"
                        value={entry.name}
                        disabled={disabled}
                        onChange={(e) => update('en', 'name', e.target.value)}
                        onBlur={() => handleBlur('en')}
                        placeholder="e.g. 7-piece cookware set"
                        className={[
                          'w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2',
                          showEnError
                            ? 'border-red-400 focus:ring-red-200'
                            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'
                        ].join(' ')}
                      />
                      <p className="text-[11px] text-gray-500">English product type / description</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-English Tabs (Russian, Chinese) */
                <div>
                  <label
                    htmlFor={`translation-${code}-name`}
                    className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-800"
                  >
                    <span className="text-base" aria-hidden>
                      {LOCALES.find((l) => l.code === code)?.flag}
                    </span>
                    {label} {dict.common.name}
                    {required ? (
                      <span className="text-red-600">*</span>
                    ) : (
                      <span className="text-xs font-normal text-gray-500">
                        {dict.products.optionalRecommended}
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
                    placeholder={dict.products.enterNamePlaceholder.replace('{label}', label)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              )}

              {showEnError && code === 'en' && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {dict.products.nameRequiredError}
                </p>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {label} {dict.common.description} {required && <span className="text-red-600">*</span>}
                  </label>
                  {code === 'en' && (
                    <span className="text-[10px] text-slate-400">Displayed on Top under Product Title</span>
                  )}
                </div>
                <RichTextEditor
                  value={entry.description}
                  disabled={disabled}
                  onChange={(html) => update(code, 'description', html)}
                  placeholder={dict.products.enterDescPlaceholder.replace('{label}', label)}
                />
                {code === 'en' && (
                  <p className="text-[11px] text-gray-500">
                    Original description displayed in hero section on product page.
                  </p>
                )}
              </div>

              {/* Dynamic Category Attributes embedded inside Hero Section box */}
              {renderAttributes ? (
                renderAttributes(code)
              ) : attributesSlot ? (
                attributesSlot
              ) : null}

              {/* SEO Meta Fields per Language Tab - Hidden for now */}
              {false && (
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label} SEO & Meta</h4>
                  <div>
                    <label htmlFor={`translation-${code}-metaTitle`} className="mb-1 block text-xs font-semibold text-gray-700">
                      {dict.products.metaTitle} ({label})
                    </label>
                    <input
                      id={`translation-${code}-metaTitle`}
                      type="text"
                      value={entry.metaTitle || ''}
                      disabled={disabled}
                      onChange={(e) => update(code, 'metaTitle', e.target.value)}
                      placeholder="SEO Meta Title"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                    />
                  </div>
                  <div>
                    <label htmlFor={`translation-${code}-metaDescription`} className="mb-1 block text-xs font-semibold text-gray-700">
                      {dict.products.metaDescription} ({label})
                    </label>
                    <textarea
                      id={`translation-${code}-metaDescription`}
                      value={entry.metaDescription || ''}
                      disabled={disabled}
                      onChange={(e) => update(code, 'metaDescription', e.target.value)}
                      placeholder="SEO Meta Description"
                      rows={2}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-200"
                    />
                  </div>
                </div>
              )}
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
