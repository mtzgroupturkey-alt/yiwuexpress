export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { localizeContactLocation } from '@/lib/utils/localize'

export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get('locale') || 'en'

    const locations = await prisma.contactLocation.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: true },
    })

    const data = locations.map((l) => localizeContactLocation(l, locale))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching contact locations:', error)
    return NextResponse.json({ error: 'Failed to fetch contact locations' }, { status: 500 })
  }
}
