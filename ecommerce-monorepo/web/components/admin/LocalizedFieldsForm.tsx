'use client'

import { useState } from 'react'
import { Check, AlertCircle, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

export type TranslationLocale = 'en' | 'ru' | 'zh'

export interface LocalizedFieldDef {
  /** Field key stored in the translation row (e.g. "name", "description"). */
  key: string
  /** Human label shown in the tab panel. */
  label: string
  /** Render as a textarea instead of a single-line input. */
  textarea?: boolean
  /** Rows for the textarea. */
  rows?: number
  /** Placeholder prefix is derived from the locale label automatically. */
}

/** One translation entry: a map of field-key -> string for a given locale. */
export type TranslationEntry = Record<string, string>

/** A single translation row sent to the API: { locale, ...fields }. */
export interface TranslationRow {
  locale: TranslationLocale
  [field: string]: string
}

export interface LocalizedFieldsFormProps {
  /** Field definitions rendered in each locale tab. */
  fields: LocalizedFieldDef[]
  /** Initial values as a flat translations array ({locale, ...fields}). */
  initialValues?: TranslationRow[]
  /** Fired on every change with the full (non-empty) translations payload. */
  onChange?: (translations: TranslationRow[]) => void
  /** Disable editing (e.g. while submitting). */
  disabled?: boolean
  /** Which locale's required field(s) must be non-empty before submit. Defaults to 'en'. */
  requiredLocale?: TranslationLocale
  /** Show the ✨ Auto-Translate button (requires English fields filled). Defaults to true. */
  autoTranslate?: boolean
  /** Target locales auto-translated into. Defaults to ['ru', 'zh']. */
  autoTranslateLocales?: TranslationLocale[]
}

const LOCALES: {
  code: TranslationLocale
  label: string
  flag: string
  required: boolean
}[] = [
  { code: 'en', label: 'English', flag: '🇬🇧', required: true },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', required: false },
  { code: 'zh', label: '中文', flag: '🇨🇳', required: false },
]

function buildInitial(
  fields: LocalizedFieldDef[],
  initial?: TranslationRow[]
): Record<TranslationLocale, TranslationEntry> {
  const initialByLocale: Partial<Record<TranslationLocale, Partial<TranslationEntry>>> = {}
  for (const row of initial || []) {
    if (row.locale === 'en' || row.locale === 'ru' || row.locale === 'zh') {
      const entry: TranslationEntry = {}
      for (const [k, v] of Object.entries(row)) {
        if (k !== 'locale') entry[k] = v
      }
      initialByLocale[row.locale] = entry
    }
  }
  const base = {} as Record<TranslationLocale, TranslationEntry>
  for (const { code } of LOCALES) {
    const entry: TranslationEntry = {}
    for (const f of fields) entry[f.key] = initialByLocale[code]?.[f.key] ?? ''
    base[code] = entry
  }
  return base
}

export function LocalizedFieldsForm({
  fields,
  initialValues,
  onChange,
  disabled = false,
  requiredLocale = 'en',
  autoTranslate = true,
  autoTranslateLocales = ['ru', 'zh'],
}: LocalizedFieldsFormProps) {
  const [activeTab, setActiveTab] = useState<TranslationLocale>('en')
  const [translations, setTranslations] = useState<Record<TranslationLocale, TranslationEntry>>(() =>
    buildInitial(fields, initialValues)
  )
  const [touched, setTouched] = useState<Record<TranslationLocale, boolean>>({
    en: false,
    ru: false,
    zh: false,
  })
  const [translating, setTranslating] = useState(false)

  const update = (locale: TranslationLocale, field: string, value: string) => {
    const next = {
      ...translations,
      [locale]: { ...translations[locale], [field]: value },
    }
    setTranslations(next)
    emit(next)
  }

  /** Replace an entire locale entry at once (used by auto-translate injection). */
  const setLocaleEntry = (locale: TranslationLocale, entry: Partial<TranslationEntry>) => {
    setTranslations((prev) => {
      const next = {
        ...prev,
        [locale]: { ...prev[locale], ...entry },
      }
      emit(next)
      return next
    })
  }

  const enComplete = fields.every(
    (f) => (translations[requiredLocale][f.key] ?? '').trim().length > 0
  )

  const handleAutoTranslate = async () => {
    if (!enComplete || translating) return
    setTranslating(true)
    try {
      const sourceFields: Record<string, string> = {}
      for (const f of fields) sourceFields[f.key] = translations[requiredLocale][f.key] ?? ''

      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fields: sourceFields, targetLocales: autoTranslateLocales }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.error || 'Auto-translation failed.')
        return
      }
      const incoming: Record<string, Record<string, string>> = data.translations || {}
      for (const locale of autoTranslateLocales) {
        if (incoming[locale]) {
          const cleaned: Partial<TranslationEntry> = {}
          for (const f of fields) {
            const v = incoming[locale][f.key]
            if (typeof v === 'string' && v.trim().length > 0) cleaned[f.key] = v
          }
          if (Object.keys(cleaned).length > 0) setLocaleEntry(locale, cleaned)
        }
      }
      toast.success('Auto-translation applied. Review and save.')
    } catch (err) {
      toast.error('Auto-translation request failed. Please try again.')
    } finally {
      setTranslating(false)
    }
  }

  const emit = (state: Record<TranslationLocale, TranslationEntry>) => {
    const payload: TranslationRow[] = LOCALES.map(({ code }) => {
      const row: TranslationRow = { locale: code, ...state[code] }
      return row
    }).filter((row) =>
      fields.some((f) => ((row as any)[f.key] ?? '').trim().length > 0)
    )
    onChange?.(payload)
  }

  const handleBlur = (locale: TranslationLocale) => {
    setTouched((t) => ({ ...t, [locale]: true }))
  }

  const requiredMissing = fields.some(
    (f) => (translations[requiredLocale][f.key] ?? '').trim().length === 0
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Auto-translate trigger */}
      {autoTranslate && autoTranslateLocales.length > 0 && (
        <div className="flex items-center justify-end gap-2 border-b border-gray-200 px-3 py-2">
          <button
            type="button"
            onClick={handleAutoTranslate}
            disabled={disabled || translating || !enComplete}
            title={
              enComplete
                ? 'Auto-translate from English using AI'
                : 'Fill in the English fields first to enable auto-translation'
            }
            className={[
              'group relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-white',
              'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 bg-[length:200%_auto]',
              'transition-all hover:bg-right focus:outline-none focus:ring-2 focus:ring-fuchsia-300',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-300',
            ].join(' ')}
          >
            <Sparkles
              className={translating ? 'w-4 h-4 animate-spin' : 'w-4 h-4'}
              aria-hidden
            />
            {translating ? 'Translating…' : '✨ Auto-Translate'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Localized fields"
        className="flex flex-wrap gap-1 border-b border-gray-200 p-2"
      >
        {LOCALES.map(({ code, label, flag, required }) => {
          const isActive = activeTab === code
          const hasAny = fields.some((f) => (translations[code][f.key] ?? '').trim().length > 0)
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
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
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
                    : 'bg-gray-200 text-gray-600',
                ].join(' ')}
              >
                {code}
              </span>
              {hasAny ? (
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
          const showRequiredError =
            code === requiredLocale && touched[code] && requiredMissing
          return (
            <div key={code} className="space-y-4">
              {fields.map((f) => {
                const value = entry[f.key] ?? ''
                const id = `lf-${code}-${f.key}`
                return (
                  <div key={f.key}>
                    <label
                      htmlFor={id}
                      className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-800"
                    >
                      <span className="text-base" aria-hidden>
                        {LOCALES.find((l) => l.code === code)?.flag}
                      </span>
                      {label} {f.label}
                      {required ? (
                        <span className="text-red-600">*</span>
                      ) : (
                        <span className="text-xs font-normal text-gray-500">
                          (optional, recommended)
                        </span>
                      )}
                    </label>
                    {f.textarea ? (
                      <textarea
                        id={id}
                        value={value}
                        disabled={disabled}
                        rows={f.rows || 4}
                        onChange={(e) => update(code, f.key, e.target.value)}
                        onBlur={() => handleBlur(code)}
                        placeholder={`Enter ${label} ${f.label.toLowerCase()}`}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      />
                    ) : (
                      <input
                        id={id}
                        type="text"
                        value={value}
                        disabled={disabled}
                        onChange={(e) => update(code, f.key, e.target.value)}
                        onBlur={() => handleBlur(code)}
                        placeholder={`Enter ${label} ${f.label.toLowerCase()}`}
                        className={[
                          'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2',
                          showRequiredError
                            ? 'border-red-400 focus:ring-red-200'
                            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200',
                        ].join(' ')}
                      />
                    )}
                  </div>
                )
              })}
              {showRequiredError && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  English ({requiredLocale.toUpperCase()}) values are required before submitting.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Helper: convert an API translations array into the TranslationRow[] shape. */
export function translationsArrayToInitial(
  translations: Array<{ locale: string; [field: string]: string }> | null | undefined
): TranslationRow[] {
  const out: TranslationRow[] = []
  for (const t of translations || []) {
    if (t.locale === 'en' || t.locale === 'ru' || t.locale === 'zh') {
      const row: TranslationRow = { locale: t.locale as TranslationLocale }
      for (const [k, v] of Object.entries(t)) {
        if (k !== 'locale') row[k] = v
      }
      out.push(row)
    }
  }
  return out
}
