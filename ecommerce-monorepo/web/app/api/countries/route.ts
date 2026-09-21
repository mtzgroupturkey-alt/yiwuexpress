export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { localizeCountry } from '@/lib/utils/localize'

// GET /api/countries - Get all active countries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'
    const locale = searchParams.get('locale') || 'en'

    const countries = await prisma.country.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        translations: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    const data = countries.map((c) => ({
      ...c,
      name: localizeCountry(c, locale).name,
    }))

    return NextResponse.json({
      success: true,
      data,
      count: data.length
    })
  } catch (error) {
    console.error('Error fetching countries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch countries' },
      { status: 500 }
    )
  }
}
