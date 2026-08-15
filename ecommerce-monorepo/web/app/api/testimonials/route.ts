export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { localizeTestimonial } from '@/lib/utils/localize'

type TestimonialTranslationInput = {
  locale: string
  quote: string
  role?: string | null
  company?: string | null
}

// Always seed `en` from legacy fields so the fallback chain stays intact.
function buildTestimonialTranslations(
  translations: TestimonialTranslationInput[] | undefined,
  legacy: { quote: string; role?: string | null; company?: string | null }
): TestimonialTranslationInput[] {
  const rows: TestimonialTranslationInput[] = []
  const seen = new Set<string>()

  if (Array.isArray(translations)) {
    for (const t of translations) {
      if (!t.locale || seen.has(t.locale)) continue
      seen.add(t.locale)
      rows.push({
        locale: t.locale,
        quote: t.quote ?? legacy.quote,
        role: t.role ?? null,
        company: t.company ?? null,
      })
    }
  }

  if (!seen.has('en')) {
    rows.push({
      locale: 'en',
      quote: legacy.quote,
      role: legacy.role ?? null,
      company: legacy.company ?? null,
    })
  }

  return rows
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const featuredOnly = searchParams.get('featured') === 'true'
    const locale = searchParams.get('locale') || 'en'

    const testimonials = await prisma.testimonial.findMany({
      where: featuredOnly ? { isFeatured: true } : {},
      orderBy: { createdAt: 'desc' },
      include: { translations: true }
    })

    const data = testimonials.map((t) => localizeTestimonial(t, locale))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const payload = token ? verifyToken(token) : null
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, company, role, quote, rating = 5, avatar, image, isFeatured = false, translations } = body

    if (!name || !company || !role || !quote) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        company,
        role,
        quote,
        rating: Number(rating),
        avatar,
        image,
        isFeatured: !!isFeatured,
        translations: {
          create: buildTestimonialTranslations(translations, { quote, role, company })
        }
      }
    })

    return NextResponse.json({ success: true, data: testimonial }, { status: 201 })
  } catch (error) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
