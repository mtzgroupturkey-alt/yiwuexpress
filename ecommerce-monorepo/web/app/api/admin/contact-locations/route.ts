export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (!includeInactive) {
      where.isActive = true
    }

    const locations = await prisma.contactLocation.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: true },
    })

    return NextResponse.json({ data: locations })
  } catch (error) {
    console.error('Error fetching contact locations:', error)
    return NextResponse.json({ error: 'Failed to fetch contact locations' }, { status: 500 })
  }
}

// Always seed `en` from the legacy fields so the fallback chain stays intact.
function buildContactLocationTranslations(
  translations: Array<{ locale: string; city?: string; address?: string | null; hours?: string | null }> | undefined,
  legacy: { city: string; address?: string | null; hours?: string | null }
): Array<{ locale: string; city: string; address?: string | null; hours?: string | null }> {
  const rows: Array<{ locale: string; city: string; address?: string | null; hours?: string | null }> = []
  const seen = new Set<string>()

  if (Array.isArray(translations)) {
    for (const t of translations) {
      if (!t.locale || seen.has(t.locale)) continue
      seen.add(t.locale)
      rows.push({
        locale: t.locale,
        city: t.city ?? legacy.city,
        address: t.address ?? null,
        hours: t.hours ?? null,
      })
    }
  }

  if (!seen.has('en')) {
    rows.push({ locale: 'en', city: legacy.city, address: legacy.address ?? null, hours: legacy.hours ?? null })
  }

  return rows
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, city, address, phone, email, hours, sortOrder, isActive, translations } = body

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }

    const location = await prisma.contactLocation.create({
      data: {
        type: type || 'HUB',
        city,
        address: address || null,
        phone: phone || null,
        email: email || null,
        hours: hours || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
        translations: {
          create: buildContactLocationTranslations(translations, { city, address, hours })
        }
      },
    })

    return NextResponse.json({ data: location }, { status: 201 })
  } catch (error) {
    console.error('Error creating contact location:', error)
    return NextResponse.json({ error: 'Failed to create contact location' }, { status: 500 })
  }
}
