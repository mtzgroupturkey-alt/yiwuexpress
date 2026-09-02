/**
 * Expand-and-Contract localisation helper.
 *
 * `RawProductFromDb` mirrors the fields we actually read off a Prisma Product
 * row. Keep this intentionally narrow — read paths pass the row (or a subset)
 * they already fetched. Do NOT depend on the full Product type here so this
 * file stays decoupled from schema churn.
 */
export interface RawProductFromDb {
  id: string
  name: string
  description?: string | null
  slug?: string | null
  translations?: Array<{
    locale: string
    name: string
    description?: string | null
  }> | null
}

export interface LocalizedProduct {
  id: string
  name: string
  description: string
  slug?: string | null
}

const FALLBACK_LOCALE = 'en'

/**
 * Canonical single-field localization fallback (the "waterfall").
 *
 * Given a list of per-locale translation rows, resolve one field for the
 * active locale with a strict three-step fallback:
 *
 *   1. Record where `locale === activeLocale` AND the target field is a
 *      non-empty string → return it.
 *   2. Record where `locale === 'en'` AND the target field is non-empty →
 *      return the English value.
 *   3. Otherwise return `legacyDefaultValue` (the parent model's root column),
 *      coerced to `''` when null/undefined so the UI never renders `null`.
 *
 * This is the single source of truth for every localized read path. Per-entity
 * helpers in this file and all public API routes delegate to it.
 */
export function getLocalField<
  T extends { locale: string }
>(
  translations: T[] | null | undefined,
  activeLocale: string,
  fieldName: string,
  legacyDefaultValue: string | null | undefined
): string {
  const list = translations ?? []
  const target = String(activeLocale)

  const read = (row: T): string => {
    const value = (row as Record<string, unknown>)[fieldName]
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : ''
  }

  const exact = list.find((row) => row.locale === target && read(row).length > 0)
  if (exact) return read(exact)

  const english = list.find((row) => row.locale === FALLBACK_LOCALE && read(row).length > 0)
  if (english) return read(english)

  return legacyDefaultValue && legacyDefaultValue.trim().length > 0 ? legacyDefaultValue : ''
}

/**
 * Resolve multiple fields of an entity at once using {@link getLocalField}.
 *
 * Pass the entity's `translations` array, the active locale, and a partial map
 * of `fieldName -> legacy root-column fallback`. Returns a record of the same
 * keys whose values are always non-null strings (safe for the storefront).
 *
 * Example:
 *   const localizedProduct = localizeEntity(product.translations, locale, {
 *     name: product.name,
 *     description: product.description,
 *   })
 */
export function localizeEntity<
  T extends { locale: string },
  K extends string
>(
  translations: T[] | null | undefined,
  activeLocale: string,
  legacyFields: Partial<Record<K, string | null | undefined>>
): Record<K, string> {
  const out = {} as Record<K, string>
  for (const key of Object.keys(legacyFields) as K[]) {
    out[key] = getLocalField(translations, activeLocale, key, legacyFields[key])
  }
  return out
}

/**
 * Resolve localised copy for a product.
 *
 * Precedence:
 *   1. Exact locale match in `translations` (non-empty name).
 *   2. English (`en`) translation.
 *   3. Legacy `name`/`description` columns (permanent fallback).
 */
export function localizeProduct(
  product: RawProductFromDb,
  locale: string
): LocalizedProduct {
  const name = getLocalField(product.translations, locale, 'name', product.name)
  const description = getLocalField(product.translations, locale, 'description', product.description)

  return {
    id: product.id,
    name,
    description,
    slug: product.slug ?? null
  }
}

/**
 * Expand-and-Contract localisation for categories.
 * Mirrors {@link localizeProduct}: explicit locale match -> English -> legacy columns.
 */
export interface RawCategoryFromDb {
  id: string
  name: string
  description?: string | null
  slug?: string | null
  translations?: Array<{
    locale: string
    name: string
    description?: string | null
  }> | null
}

export interface LocalizedCategory {
  id: string
  name: string
  description: string
  slug?: string | null
}

export function localizeCategory(
  category: RawCategoryFromDb,
  locale: string
): LocalizedCategory {
  const name = getLocalField(category.translations, locale, 'name', category.name)
  const description = getLocalField(category.translations, locale, 'description', category.description)

  return {
    id: category.id,
    name,
    description,
    slug: category.slug ?? null
  }
}

/**
 * Expand-and-Contract localisation for hero slides.
 * Fallback chain: exact locale -> en -> legacy columns.
 */
export interface RawHeroSlideFromDb {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  badgeText?: string | null
  ctaText: string
  secondaryCtaText?: string | null
  imageUrl?: string | null
  mobileImageUrl?: string | null
  productImageUrl?: string | null
  translations?: Array<{
    locale: string
    title: string
    subtitle?: string | null
    description?: string | null
    badgeText?: string | null
    ctaText: string
    secondaryCtaText?: string | null
    imageUrl?: string | null
    mobileImageUrl?: string | null
    productImageUrl?: string | null
  }> | null
}

export interface LocalizedHeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  badgeText: string | null
  ctaText: string
  secondaryCtaText: string | null
  imageUrl: string
  mobileImageUrl: string | null
  productImageUrl: string | null
}

export function localizeHeroSlide(
  slide: RawHeroSlideFromDb,
  locale: string
): LocalizedHeroSlide {
  const target = String(locale)
  const translations = slide.translations ?? []

  const resolution = translations.find(
    (t) => t.locale === target && t.title && t.title.trim().length > 0
  ) ?? translations.find(
    (t) => t.locale === FALLBACK_LOCALE && t.title && t.title.trim().length > 0
  )

  if (resolution) {
    return {
      id: slide.id,
      title: resolution.title,
      subtitle: resolution.subtitle ?? slide.subtitle ?? '',
      description: resolution.description ?? slide.description ?? '',
      badgeText: resolution.badgeText ?? slide.badgeText ?? null,
      ctaText: resolution.ctaText,
      secondaryCtaText: resolution.secondaryCtaText ?? slide.secondaryCtaText ?? null,
      imageUrl: resolution.imageUrl ?? slide.imageUrl ?? '',
      mobileImageUrl: resolution.mobileImageUrl ?? slide.mobileImageUrl ?? null,
      productImageUrl: resolution.productImageUrl ?? slide.productImageUrl ?? null,
    }
  }

  return {
    id: slide.id,
    title: slide.title,
    subtitle: slide.subtitle ?? '',
    description: slide.description ?? '',
    badgeText: slide.badgeText ?? null,
    ctaText: slide.ctaText,
    secondaryCtaText: slide.secondaryCtaText ?? null,
    imageUrl: slide.imageUrl ?? '',
    mobileImageUrl: slide.mobileImageUrl ?? null,
    productImageUrl: slide.productImageUrl ?? null,
  }
}

/**
 * Expand-and-Contract localisation for services.
 * Fallback chain: exact locale -> en -> legacy columns.
 */
export interface RawServiceFromDb {
  id: string
  name: string
  slug?: string
  description?: string | null
  price?: number
  duration?: string | null
  coverage?: string | null
  type?: string
  image?: string | null
  isActive?: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
  translations?: Array<{
    locale: string
    name: string
    description?: string | null
    coverage?: string | null
    duration?: string | null
  }> | null
  [key: string]: any
}

export interface LocalizedService extends RawServiceFromDb {
  id: string
  name: string
  description: string
  coverage: string | null
  duration: string | null
}

export function localizeService<T extends RawServiceFromDb>(
  service: T,
  locale: string
): T & LocalizedService {
  const target = String(locale)
  const translations = service.translations ?? []

  const resolution = translations.find(
    (t) => t.locale === target && t.name && t.name.trim().length > 0
  ) ?? translations.find(
    (t) => t.locale === FALLBACK_LOCALE && t.name && t.name.trim().length > 0
  )

  if (resolution) {
    return {
      ...service,
      id: service.id,
      name: resolution.name,
      description: resolution.description ?? service.description ?? '',
      coverage: resolution.coverage ?? service.coverage ?? null,
      duration: resolution.duration ?? service.duration ?? null
    }
  }

  return {
    ...service,
    id: service.id,
    name: service.name,
    description: service.description ?? '',
    coverage: service.coverage ?? null,
    duration: service.duration ?? null
  }
}

/**
 * Expand-and-Contract localisation for testimonials.
 * `name`, `company` and `role` are treated as person/org identifiers and stay
 * single-language; only `quote` is translated.
 * Fallback chain: exact locale -> en -> legacy `quote` column.
 */
export interface RawTestimonialFromDb {
  id: string
  name: string
  company?: string | null
  role?: string | null
  quote: string
  translations?: Array<{
    locale: string
    quote: string
    role?: string | null
    company?: string | null
  }> | null
}

export interface LocalizedTestimonial {
  id: string
  name: string
  company: string | null
  role: string | null
  quote: string
}

export function localizeTestimonial(
  testimonial: RawTestimonialFromDb,
  locale: string
): LocalizedTestimonial {
  const target = String(locale)
  const translations = testimonial.translations ?? []

  const resolution = translations.find(
    (t) => t.locale === target && t.quote && t.quote.trim().length > 0
  ) ?? translations.find(
    (t) => t.locale === FALLBACK_LOCALE && t.quote && t.quote.trim().length > 0
  )

  if (resolution) {
    return {
      id: testimonial.id,
      name: testimonial.name,
      company: resolution.company ?? testimonial.company ?? null,
      role: resolution.role ?? testimonial.role ?? null,
      quote: resolution.quote
    }
  }

  return {
    id: testimonial.id,
    name: testimonial.name,
    company: testimonial.company ?? null,
    role: testimonial.role ?? null,
    quote: testimonial.quote
  }
}

// ─── Phase 2 helpers ────────────────────────────────────────────────────────

function resolveByLocale<T extends { locale: string }>(
  translations: T[] | null | undefined,
  target: string,
  isFallback: (row: T) => boolean
): T | undefined {
  const list = translations ?? []
  return (
    list.find((t) => t.locale === target && isFallback(t)) ??
    list.find((t) => t.locale === FALLBACK_LOCALE && isFallback(t))
  )
}

export interface RawAttributeFromDb {
  id: string
  name: string
  translations?: Array<{ locale: string; name: string }> | null
}

export function localizeAttribute(attribute: RawAttributeFromDb, locale: string) {
  const target = String(locale)
  const row = resolveByLocale(attribute.translations, target, (t) => !!t.name && t.name.trim().length > 0)
  return { id: attribute.id, name: row?.name ?? attribute.name }
}

export interface RawAttributeValueFromDb {
  id: string
  value: string
  translations?: Array<{ locale: string; value: string }> | null
}

export function localizeAttributeValue(value: RawAttributeValueFromDb, locale: string) {
  const target = String(locale)
  const row = resolveByLocale(value.translations, target, (t) => !!t.value && t.value.trim().length > 0)
  return { id: value.id, value: row?.value ?? value.value }
}

export interface RawShippingMethodFromDb {
  id: string
  name: string
  description?: string | null
  translations?: Array<{ locale: string; name: string; description?: string | null }> | null
}

export function localizeShippingMethod(method: RawShippingMethodFromDb, locale: string) {
  const target = String(locale)
  const row = resolveByLocale(
    method.translations,
    target,
    (t) => !!t.name && t.name.trim().length > 0
  )
  return {
    id: method.id,
    name: row?.name ?? method.name,
    description: row?.description ?? method.description ?? null,
  }
}

export interface RawContactLocationFromDb {
  id: string
  type?: string
  city: string
  address?: string | null
  phone?: string | null
  email?: string | null
  hours?: string | null
  translations?: Array<{ locale: string; city: string; address?: string | null; hours?: string | null }> | null
}

export function localizeContactLocation(location: RawContactLocationFromDb, locale: string) {
  const target = String(locale)
  const row = resolveByLocale(location.translations, target, (t) => !!t.city && t.city.trim().length > 0)
  return {
    id: location.id,
    type: location.type ?? null,
    city: row?.city ?? location.city,
    address: row?.address ?? location.address ?? null,
    phone: location.phone ?? null,
    email: location.email ?? null,
    hours: row?.hours ?? location.hours ?? null,
  }
}

export interface RawPageBannerFromDb {
  id?: string
  title?: string | null
  subtitle?: string | null
  translations?: Array<{ locale: string; title?: string | null; subtitle?: string | null }> | null
}

export function localizePageBanner(banner: RawPageBannerFromDb, locale: string) {
  const target = String(locale)
  const row = resolveByLocale(
    banner.translations,
    target,
    (t) => Boolean((t.title && t.title.trim().length > 0) || (t.subtitle && t.subtitle.trim().length > 0))
  )
  return {
    id: banner.id,
    title: row?.title ?? banner.title ?? null,
    subtitle: row?.subtitle ?? banner.subtitle ?? null,
  }
}

/**
 * Localize the dynamic variant `attributes` JSON (e.g. { "Color": "Red" }).
 * Keys map to Attribute names, values map to AttributeValue values. We accept
 * pre-fetched translation maps keyed by attribute id / attributeValue id (or
 * slug) and return a new object with localized { key, value } pairs while
 * preserving the original JSON for any key/value without a translation.
 */
export interface VariantAttributeLocalizers {
  attributeNames?: Record<string, string>      // original name -> localized name
  attributeValueValues?: Record<string, string> // original value -> localized value
}

export function localizeVariantAttributes(
  attributes: Record<string, any> | null | undefined,
  locale: string,
  localizers: VariantAttributeLocalizers
): Record<string, any> {
  if (!attributes) return attributes as any
  const target = String(locale)
  if (target === FALLBACK_LOCALE) return attributes

  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(attributes)) {
    const localizedKey = localizers.attributeNames?.[key] ?? key
    let localizedValue = value
    if (typeof value === 'string') {
      localizedValue = localizers.attributeValueValues?.[value] ?? value
    } else if (Array.isArray(value)) {
      localizedValue = value.map((v) => (typeof v === 'string' ? localizers.attributeValueValues?.[v] ?? v : v))
    }
    out[localizedKey] = localizedValue
  }
  return out
}

// ─── Phase 3 helpers ────────────────────────────────────────────────────────

export interface RawCountryFromDb {
  id: string
  name: string
  translations?: Array<{ locale: string; name: string }> | null
}

export function localizeCountry(country: RawCountryFromDb, locale: string) {
  const target = String(locale)
  const row = resolveByLocale(country.translations, target, (t) => !!t.name && t.name.trim().length > 0)
  return { id: country.id, name: row?.name ?? country.name }
}

export interface RawSupplierFromDb {
  id: string
  name: string
  description?: string | null
  profileText?: string | null
  translations?: Array<{ locale: string; name: string; description?: string | null; profileText?: string | null }> | null
}

export function localizeSupplier(supplier: RawSupplierFromDb, locale: string) {
  const target = String(locale)
  const row = resolveByLocale(supplier.translations, target, (t) => !!t.name && t.name.trim().length > 0)
  return {
    id: supplier.id,
    name: row?.name ?? supplier.name,
    description: row?.description ?? supplier.description ?? null,
    profileText: row?.profileText ?? supplier.profileText ?? null,
  }
}

/**
 * Localize a single SystemSettings text-block field by key, falling back to the
 * provided English (legacy) value. `translations` is the array of
 * SystemSettingTranslation rows for the settings row.
 */
export function localizeSystemSetting(
  translations: Array<{ locale: string; key: string; value: string }> | null | undefined,
  key: string,
  fallbackEn: string | null | undefined,
  locale: string
): string {
  const target = String(locale)
  if (target === FALLBACK_LOCALE) return fallbackEn ?? ''
  const list = (translations || []).filter((t) => t.key === key)
  const row =
    list.find((t) => t.locale === target && t.value && t.value.trim().length > 0) ??
    list.find((t) => t.locale === FALLBACK_LOCALE && t.value && t.value.trim().length > 0)
  return row?.value ?? fallbackEn ?? ''
}

export interface RawEmailTemplateFromDb {
  id: string
  type: string
  subject: string
  bodyHtml: string
  bodyText?: string | null
  translations?: Array<{ locale: string; subject: string; bodyHtml: string; bodyText?: string | null }> | null
}

export interface LocalizedEmailTemplate {
  subject: string
  bodyHtml: string
  bodyText: string
}

/**
 * Resolve an email template's localized copy for the requested locale, falling
 * back to the canonical English (legacy) columns. The returned copy still
 * contains `{placeholder}` tokens that the mailer must replace with order/user
 * data before sending.
 */
export function localizeEmailTemplate(template: RawEmailTemplateFromDb, locale: string): LocalizedEmailTemplate {
  const target = String(locale)
  const row = resolveByLocale(
    template.translations,
    target,
    (t) => !!t.subject && t.subject.trim().length > 0 && !!t.bodyHtml && t.bodyHtml.trim().length > 0
  )
  return {
    subject: row?.subject ?? template.subject,
    bodyHtml: row?.bodyHtml ?? template.bodyHtml,
    bodyText: row?.bodyText ?? template.bodyText ?? '',
  }
}
