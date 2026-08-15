'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

export type AutoTranslateLocale = 'en' | 'ru' | 'zh'

export interface AutoTranslateButtonProps {
  /**
   * The populated English (en) source fields to translate, keyed by field name.
   * The button is disabled when none of these values are non-empty.
   */
  enFields: Record<string, string>
  /** Called with the parsed translations for each target locale on success. */
  onTranslated: (translations: Record<string, Record<string, string>>) => void
  /** Disable the button entirely (e.g. while the parent form is submitting). */
  disabled?: boolean
  /** Target locales to translate into. Defaults to ['ru', 'zh']. */
  targetLocales?: AutoTranslateLocale[]
  /** Optional label override. */
  label?: string
}

/**
 * Reusable ✨ Auto-Translate trigger. Posts the English source fields to the
 * central admin translation hub (/api/admin/translate) and injects the returned
 * ru/zh translations via `onTranslated`. Never saves — human-in-the-loop only.
 */
export function AutoTranslateButton({
  enFields,
  onTranslated,
  disabled = false,
  targetLocales = ['ru', 'zh'],
  label = '✨ Auto-Translate',
}: AutoTranslateButtonProps) {
  const [translating, setTranslating] = useState(false)

  const enFilled = Object.values(enFields).some((v) => (v ?? '').toString().trim().length > 0)
  const isDisabled = disabled || translating || !enFilled

  const handleClick = async () => {
    if (isDisabled) return
    setTranslating(true)
    try {
      const sourceFields: Record<string, string> = {}
      for (const [k, v] of Object.entries(enFields)) {
        const s = (v ?? '').toString()
        if (s.trim().length > 0) sourceFields[k] = s
      }

      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fields: sourceFields, targetLocales }),
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
        enFilled
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
      <Sparkles className={translating ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} aria-hidden />
      {translating ? 'Translating…' : label}
    </button>
  )
}
