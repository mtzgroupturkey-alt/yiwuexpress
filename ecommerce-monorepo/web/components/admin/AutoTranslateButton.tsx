'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'

export type AutoTranslateLocale = 'en' | 'ru' | 'zh'

export interface AutoTranslateButtonProps {
  /**
   * The populated English (en) source fields to translate, keyed by field name.
   * Kept for backwards compatibility.
   */
  enFields?: Record<string, string>
  /**
   * Multi-locale fields map: { en?: {...}, ru?: {...}, zh?: {...} }.
   * If provided, the button checks current fields across all locales.
   * If user typed in Russian first, Russian is used as source and translated to English + Chinese.
   */
  allFields?: Partial<Record<AutoTranslateLocale, Record<string, string>>>
  /**
   * Direct source fields if locale already known or single dictionary passed.
   */
  sourceFields?: Record<string, string>
  /**
   * Explicit source locale if known ('en' | 'ru' | 'zh').
   */
  sourceLocale?: AutoTranslateLocale
  /** Called with the parsed translations for each target locale on success. */
  onTranslated: (translations: Record<string, Record<string, string>>) => void
  /** Disable the button entirely (e.g. while the parent form is submitting). */
  disabled?: boolean
  /** Target locales to translate into. If omitted, automatically determined (all locales other than source). */
  targetLocales?: AutoTranslateLocale[]
  /** Optional label override. */
  label?: string
}

/**
 * Reusable ✨ Auto-Translate trigger.
 * Supports multi-directional translation:
 * If an employee fills fields in Russian, it auto-detects Russian and translates
 * to English and Chinese (or vice versa).
 * Human-in-the-loop only — never saves directly.
 */
export function AutoTranslateButton({
  enFields,
  allFields,
  sourceFields: directSourceFields,
  sourceLocale: explicitSourceLocale,
  onTranslated,
  disabled = false,
  targetLocales: explicitTargetLocales,
  label,
}: AutoTranslateButtonProps) {
  const { dict } = useAdminLocale()
  const displayLabel = label || `✨ ${dict.common.autoTranslate}`
  const [translating, setTranslating] = useState(false)

  // Resolve best source locale and fields
  let detectedSourceLocale: AutoTranslateLocale = explicitSourceLocale || 'en'
  let activeSourceFields: Record<string, string> = {}

  if (directSourceFields && Object.values(directSourceFields).some((v) => (v ?? '').toString().trim().length > 0)) {
    activeSourceFields = directSourceFields
  } else if (allFields) {
    // Prefer explicit source locale if it has content
    if (explicitSourceLocale && allFields[explicitSourceLocale] && Object.values(allFields[explicitSourceLocale]!).some((v) => (v ?? '').toString().trim().length > 0)) {
      detectedSourceLocale = explicitSourceLocale
      activeSourceFields = allFields[explicitSourceLocale]!
    } else {
      // Priority check: EN first, then RU, then ZH
      const priority: AutoTranslateLocale[] = ['en', 'ru', 'zh']
      for (const loc of priority) {
        const fields = allFields[loc]
        if (fields && Object.values(fields).some((v) => (v ?? '').toString().trim().length > 0)) {
          detectedSourceLocale = loc
          activeSourceFields = fields
          break
        }
      }
    }
  } else if (enFields) {
    detectedSourceLocale = 'en'
    activeSourceFields = enFields
  }

  const hasSourceContent = Object.values(activeSourceFields).some((v) => (v ?? '').toString().trim().length > 0)
  const isDisabled = disabled || translating || !hasSourceContent

  // Determine target locales: if explicitly provided use them, else all locales except source
  const ALL_LOCALES: AutoTranslateLocale[] = ['en', 'ru', 'zh']
  const targetLocales: AutoTranslateLocale[] = explicitTargetLocales && explicitTargetLocales.length > 0
    ? explicitTargetLocales.filter((l) => l !== detectedSourceLocale)
    : ALL_LOCALES.filter((l) => l !== detectedSourceLocale)

  const handleClick = async () => {
    if (isDisabled || targetLocales.length === 0) return
    setTranslating(true)
    try {
      const payloadFields: Record<string, string> = {}
      for (const [k, v] of Object.entries(activeSourceFields)) {
        const s = (v ?? '').toString()
        if (s.trim().length > 0) payloadFields[k] = s
      }

      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fields: payloadFields, targetLocales }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.error || 'Auto-translation failed.')
        return
      }
      const incoming: Record<string, Record<string, string>> = data.translations || {}
      const merged: Record<string, Record<string, string>> = {}
      for (const locale of targetLocales) {
        const entry = incoming[locale]
        if (entry && typeof entry === 'object') merged[locale] = entry
      }
      if (Object.keys(merged).length === 0) {
        toast.error('Translation service returned no content.')
        return
      }
      onTranslated(merged)
      toast.success('Auto-translation applied. Review and save.')
    } catch (err) {
      toast.error('Auto-translation request failed. Please try again.')
    } finally {
      setTranslating(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      title={
        hasSourceContent
          ? `Auto-translate from ${detectedSourceLocale.toUpperCase()} using AI`
          : 'Fill in any language field first to enable auto-translation'
      }
      className={[
        'group relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-white',
        'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 bg-[length:200%_auto]',
        'transition-all hover:bg-right focus:outline-none focus:ring-2 focus:ring-fuchsia-300',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-300',
      ].join(' ')}
    >
      <Sparkles className={translating ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} aria-hidden />
      {translating ? dict.common.translating : displayLabel}
    </button>
  )
}
