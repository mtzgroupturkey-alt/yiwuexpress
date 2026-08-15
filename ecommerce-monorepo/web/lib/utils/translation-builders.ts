/**
 * Translation payload builders for Phase 3 dual-write. These mirror the
 * Phase 2 `buildXTranslations` helpers: they take the incoming request body and
 * return a Prisma `translations.create` nested payload (only non-empty locales),
 * never dropping the canonical `en` row.
 */

const TRANSLATABLE_LOCALES = ['ru', 'zh'] as const

type TranslationInput = { locale: string; [field: string]: any }

function buildTranslationCreate(
  body: any,
  fields: string[]
): any[] {
  const translations: any[] = (body?.translations as any[] | undefined) || []
  const rows = translations
    .filter((t) => t && t.locale && TRANSLATABLE_LOCALES.includes(t.locale as any))
    .filter((t) => fields.some((f) => (t[f] ?? '').toString().trim().length > 0))
    .map((t) => {
      const row: any = { locale: t.locale }
      for (const f of fields) row[f] = (t[f] ?? '').toString().trim()
      return row
    })
  return rows
}

export function buildCountryTranslations(body: any) {
  const rows = buildTranslationCreate(body, ['name'])
  return rows.length ? { create: rows } : undefined
}

export function buildSupplierTranslations(body: any) {
  const rows = buildTranslationCreate(body, ['name', 'description', 'profileText'])
  return rows.length ? { create: rows } : undefined
}

export function buildEmailTemplateTranslations(body: any) {
  const rows = buildTranslationCreate(body, ['subject', 'bodyHtml', 'bodyText'])
  return rows.length ? { create: rows } : undefined
}

/**
 * Build per-key SystemSetting translation rows. The body carries
 * `translations: [{ locale, key, value }]` (matching the unique
 * [systemSettingId, locale, key] constraint). We accept all locales here
 * because the settings singleton has a single `en` row to attach to.
 */
export function buildSystemSettingTranslations(body: any) {
  const translations: any[] = (body?.translations as any[] | undefined) || []
  const rows = translations
    .filter((t) => t && t.locale && t.key && (t.value ?? '').toString().trim().length > 0)
    .map((t) => ({ locale: t.locale, key: t.key, value: t.value.toString().trim() }))
  return rows.length ? { create: rows } : undefined
}
