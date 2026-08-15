export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken, getTokenFromRequest } from '@/lib/auth'

type HeroTranslationInput = {
  locale: string
  title: string
  subtitle?: string | null
  description?: string | null
  badgeText?: string | null
  ctaText: string
  secondaryCtaText?: string | null
}

// Build the list of translation rows to create. Always seed `en` from the
// legacy fields so the fallback chain stays intact even if the form omits it.
function buildHeroTranslations(
  translations: HeroTranslationInput[] | undefined,
  legacy: {
    title: string
    subtitle?: string | null
    description?: string | null
    badgeText?: string | null
    ctaText: string
    secondaryCtaText?: string | null
  }
): HeroTranslationInput[] {
  const rows: HeroTranslationInput[] = []
  const seen = new Set<string>()

  if (Array.isArray(translations)) {
    for (const t of translations) {
      if (!t.locale || seen.has(t.locale)) continue
      seen.add(t.locale)
      rows.push({
        locale: t.locale,
        title: t.title ?? legacy.title,
        subtitle: t.subtitle ?? null,
        description: t.description ?? null,
        badgeText: t.badgeText ?? null,
        ctaText: t.ctaText ?? legacy.ctaText,
        secondaryCtaText: t.secondaryCtaText ?? null,
      })
    }
  }

  if (!seen.has('en')) {
    rows.push({
      locale: 'en',
      title: legacy.title,
      subtitle: legacy.subtitle ?? null,
      description: legacy.description ?? null,
      badgeText: legacy.badgeText ?? null,
      ctaText: legacy.ctaText,
      secondaryCtaText: legacy.secondaryCtaText ?? null,
    })
  }

  return rows
}

async function getAuthUser(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return null
  return await getUserFromToken(token)
}

async function requireAdmin(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'ADMIN') {
    return null
  }
  return user
}

// GET - List all hero slides
export async function GET(req: NextRequest) {
  try {
    const user = await requireAdmin(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const slides = await prisma.heroSlide.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { translations: true },
    })

    return NextResponse.json({ data: slides })
  } catch (error) {
    console.error('Failed to fetch hero slides:', error)
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 })
  }
}

// POST - Create a new hero slide
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      subtitle,
      description,
      imageUrl,
      mobileImageUrl,
      productImageUrl,
      badgeText,
      badgeColor,
      ctaText,
      ctaLink,
      secondaryCtaText,
      secondaryCtaLink,
      overlayColor,
      textColor,
      slideDuration,
      isActive,
      translations,
    } = body

    if (!title || !imageUrl || !ctaText || !ctaLink) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current max display order
    const maxOrder = await prisma.heroSlide.aggregate({
      _max: { displayOrder: true },
    })

    const slide = await prisma.heroSlide.create({
      data: {
        title,
        subtitle: subtitle || null,
        description: description || null,
        imageUrl,
        mobileImageUrl: mobileImageUrl || null,
        productImageUrl: productImageUrl || null,
        badgeText: badgeText || null,
        badgeColor: badgeColor || null,
        ctaText,
        ctaLink,
        secondaryCtaText: secondaryCtaText || null,
        secondaryCtaLink: secondaryCtaLink || null,
        overlayColor: overlayColor || null,
        textColor: textColor || null,
        slideDuration: slideDuration || 5,
        isActive: isActive !== false,
        displayOrder: (maxOrder._max.displayOrder || -1) + 1,
        translations: {
          create: buildHeroTranslations(translations, {
            title, subtitle, description, badgeText, ctaText, secondaryCtaText
          })
        }
      },
    })

    return NextResponse.json({ data: slide }, { status: 201 })
  } catch (error) {
    console.error('Failed to create hero slide:', error)
    return NextResponse.json({ error: 'Failed to create slide' }, { status: 500 })
  }
}
