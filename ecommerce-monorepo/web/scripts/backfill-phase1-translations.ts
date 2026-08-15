/**
 * One-time backfill: seed translation tables (locale='en') from the legacy
 * `name`/`description`/`coverage`/`duration` (Service),
 * `title`/`subtitle`/`description`/`badgeText`/`ctaText`/`secondaryCtaText` (HeroSlide),
 * `quote`/`role`/`company` (Testimonial) columns for every existing row.
 *
 * Idempotent: uses upsert on (parentId, locale) so re-running is safe.
 * Run with:  npx tsx scripts/backfill-phase1-translations.ts
 */
import { prisma } from '../lib/db'

async function main() {
  // ---- Services ----
  const services = await prisma.service.findMany({
    select: { id: true, name: true, description: true, coverage: true, duration: true }
  })
  for (const s of services) {
    await prisma.serviceTranslation.upsert({
      where: { serviceId_locale: { serviceId: s.id, locale: 'en' } },
      create: {
        serviceId: s.id,
        locale: 'en',
        name: s.name,
        description: s.description ?? null,
        coverage: s.coverage ?? null,
        duration: s.duration ?? null
      },
      update: {
        name: s.name,
        description: s.description ?? null,
        coverage: s.coverage ?? null,
        duration: s.duration ?? null
      }
    })
  }
  console.log(`Services backfilled: ${services.length}`)

  // ---- HeroSlides ----
  const slides = await prisma.heroSlide.findMany({
    select: {
      id: true, title: true, subtitle: true, description: true,
      badgeText: true, ctaText: true, secondaryCtaText: true
    }
  })
  for (const h of slides) {
    await prisma.heroSlideTranslation.upsert({
      where: { heroSlideId_locale: { heroSlideId: h.id, locale: 'en' } },
      create: {
        heroSlideId: h.id,
        locale: 'en',
        title: h.title,
        subtitle: h.subtitle ?? null,
        description: h.description ?? null,
        badgeText: h.badgeText ?? null,
        ctaText: h.ctaText,
        secondaryCtaText: h.secondaryCtaText ?? null
      },
      update: {
        title: h.title,
        subtitle: h.subtitle ?? null,
        description: h.description ?? null,
        badgeText: h.badgeText ?? null,
        ctaText: h.ctaText,
        secondaryCtaText: h.secondaryCtaText ?? null
      }
    })
  }
  console.log(`HeroSlides backfilled: ${slides.length}`)

  // ---- Testimonials ----
  const testimonials = await prisma.testimonial.findMany({
    select: { id: true, quote: true, role: true, company: true }
  })
  for (const t of testimonials) {
    await prisma.testimonialTranslation.upsert({
      where: { testimonialId_locale: { testimonialId: t.id, locale: 'en' } },
      create: {
        testimonialId: t.id,
        locale: 'en',
        quote: t.quote,
        role: t.role ?? null,
        company: t.company ?? null
      },
      update: {
        quote: t.quote,
        role: t.role ?? null,
        company: t.company ?? null
      }
    })
  }
  console.log(`Testimonials backfilled: ${testimonials.length}`)

  console.log('Phase 1 backfill complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
