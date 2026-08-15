export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// Always seed `en` from the legacy fields so the fallback chain stays intact.
function buildPageBannerTranslations(
  translations: Array<{ locale: string; title?: string | null; subtitle?: string | null }> | undefined,
  legacy: { title?: string | null; subtitle?: string | null }
): Array<{ locale: string; title?: string | null; subtitle?: string | null }> {
  const rows: Array<{ locale: string; title?: string | null; subtitle?: string | null }> = []
  const seen = new Set<string>()

  if (Array.isArray(translations)) {
    for (const t of translations) {
      if (!t.locale || seen.has(t.locale)) continue
      seen.add(t.locale)
      rows.push({ locale: t.locale, title: t.title ?? null, subtitle: t.subtitle ?? null })
    }
  }

  if (!seen.has('en')) {
    rows.push({ locale: 'en', title: legacy.title ?? null, subtitle: legacy.subtitle ?? null })
  }

  return rows
}

// GET - List all breadcrumb settings
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.breadcrumbSetting.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        translations: true,
      },
      orderBy: [
        { pageType: 'asc' },
        { pageSlug: 'asc' },
      ],
    })

    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Error fetching breadcrumb settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new breadcrumb setting
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { pageType, pageSlug, categoryId, imageUrl, mobileImageUrl, overlayColor, title, subtitle, isActive, translations } = body

    // Validation
    if (!pageType || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for duplicates
    const where: any = { pageType }
    if (pageType === 'static' && pageSlug) where.pageSlug = pageSlug
    if (pageType === 'category' && categoryId) where.categoryId = categoryId

    const existing = await prisma.breadcrumbSetting.findFirst({ where })
    if (existing) {
      return NextResponse.json({ error: 'A setting for this page already exists' }, { status: 409 })
    }

    const setting = await prisma.breadcrumbSetting.create({
      data: {
        pageType,
        pageSlug: pageType === 'static' ? pageSlug : null,
        categoryId: pageType === 'category' ? categoryId : null,
        imageUrl,
        mobileImageUrl: mobileImageUrl || null,
        overlayColor: overlayColor || null,
        title: title || null,
        subtitle: subtitle || null,
        isActive: isActive !== false,
        translations: {
          create: buildPageBannerTranslations(translations, { title, subtitle })
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ data: setting }, { status: 201 })
  } catch (error) {
    console.error('Error creating breadcrumb setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
