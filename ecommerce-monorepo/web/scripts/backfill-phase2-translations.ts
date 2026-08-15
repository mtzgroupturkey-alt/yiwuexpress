/**
 * Phase 2 backfill: seed translation tables (locale='en') from the legacy
 * columns for every existing row of:
 *   - Attribute            -> AttributeTranslation(name)
 *   - AttributeValue       -> AttributeValueTranslation(value)
 *   - ShippingMethod       -> ShippingMethodTranslation(name, description)
 *   - ContactLocation      -> ContactLocationTranslation(city, address, hours)
 *   - BreadcrumbSetting    -> PageBannerTranslation(title, subtitle)
 *
 * Idempotent: uses upsert on (parentId, locale) so re-running is safe.
 * Run with:  npx tsx scripts/backfill-phase2-translations.ts
 */
import { prisma } from '../lib/db'

async function main() {
  // ---- Attributes ----
  const attributes = await prisma.attribute.findMany({ select: { id: true, name: true } })
  for (const a of attributes) {
    await prisma.attributeTranslation.upsert({
      where: { attributeId_locale: { attributeId: a.id, locale: 'en' } },
      create: { attributeId: a.id, locale: 'en', name: a.name },
      update: { name: a.name },
    })
  }
  console.log(`Attributes backfilled: ${attributes.length}`)

  // ---- AttributeValues ----
  const values = await prisma.attributeValue.findMany({ select: { id: true, value: true } })
  for (const v of values) {
    await prisma.attributeValueTranslation.upsert({
      where: { attributeValueId_locale: { attributeValueId: v.id, locale: 'en' } },
      create: { attributeValueId: v.id, locale: 'en', value: v.value },
      update: { value: v.value },
    })
  }
  console.log(`AttributeValues backfilled: ${values.length}`)

  // ---- ShippingMethods ----
  const methods = await prisma.shippingMethod.findMany({
    select: { id: true, name: true, description: true }
  })
  for (const m of methods) {
    await prisma.shippingMethodTranslation.upsert({
      where: { shippingMethodId_locale: { shippingMethodId: m.id, locale: 'en' } },
      create: { shippingMethodId: m.id, locale: 'en', name: m.name, description: m.description ?? null },
      update: { name: m.name, description: m.description ?? null },
    })
  }
  console.log(`ShippingMethods backfilled: ${methods.length}`)

  // ---- ContactLocations ----
  const locations = await prisma.contactLocation.findMany({
    select: { id: true, city: true, address: true, hours: true }
  })
  for (const l of locations) {
    await prisma.contactLocationTranslation.upsert({
      where: { contactLocationId_locale: { contactLocationId: l.id, locale: 'en' } },
      create: {
        contactLocationId: l.id,
        locale: 'en',
        city: l.city,
        address: l.address ?? null,
        hours: l.hours ?? null
      },
      update: { city: l.city, address: l.address ?? null, hours: l.hours ?? null },
    })
  }
  console.log(`ContactLocations backfilled: ${locations.length}`)

  // ---- BreadcrumbSettings (PageBanners) ----
  const banners = await prisma.breadcrumbSetting.findMany({
    select: { id: true, title: true, subtitle: true }
  })
  for (const b of banners) {
    await prisma.pageBannerTranslation.upsert({
      where: { pageBannerId_locale: { pageBannerId: b.id, locale: 'en' } },
      create: { pageBannerId: b.id, locale: 'en', title: b.title ?? null, subtitle: b.subtitle ?? null },
      update: { title: b.title ?? null, subtitle: b.subtitle ?? null },
    })
  }
  console.log(`PageBanners (breadcrumbs) backfilled: ${banners.length}`)

  console.log('Phase 2 backfill complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
