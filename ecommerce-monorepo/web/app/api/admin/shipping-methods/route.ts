export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const methods = await prisma.shippingMethod.findMany({
      orderBy: { createdAt: 'asc' },
      include: { translations: true },
    })
    return NextResponse.json({ data: methods })
  } catch (error) {
    console.error('Error fetching shipping methods:', error)
    return NextResponse.json({ error: 'Failed to fetch shipping methods' }, { status: 500 })
  }
}

// Always seed `en` from the legacy fields so the fallback chain stays intact.
function buildShippingMethodTranslations(
  translations: Array<{ locale: string; name?: string; description?: string | null }> | undefined,
  legacy: { name: string; description?: string | null }
): Array<{ locale: string; name: string; description?: string | null }> {
  const rows: Array<{ locale: string; name: string; description?: string | null }> = []
  const seen = new Set<string>()

  if (Array.isArray(translations)) {
    for (const t of translations) {
      if (!t.locale || seen.has(t.locale)) continue
      seen.add(t.locale)
      rows.push({ locale: t.locale, name: t.name ?? legacy.name, description: t.description ?? null })
    }
  }

  if (!seen.has('en')) {
    rows.push({ locale: 'en', name: legacy.name, description: legacy.description ?? null })
  }

  return rows
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, description, defaultStatuses, customStatusesAllowed, translations } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const method = await prisma.shippingMethod.create({
      data: {
        name,
        slug,
        description,
        defaultStatuses: defaultStatuses || [],
        customStatusesAllowed: customStatusesAllowed ?? true,
        translations: {
          create: buildShippingMethodTranslations(translations, { name, description })
        }
      },
    })

    return NextResponse.json({ data: method }, { status: 201 })
  } catch (error) {
    console.error('Error creating shipping method:', error)
    return NextResponse.json({ error: 'Failed to create shipping method' }, { status: 500 })
  }
}
