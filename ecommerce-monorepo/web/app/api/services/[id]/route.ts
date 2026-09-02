export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { localizeService } from '@/lib/utils/localize'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams.id
    const searchParams = request.nextUrl.searchParams
    const locale = searchParams.get('locale') || 'en'

    const service = await prisma.service.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      },
      include: {
        translations: true
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const localized = localizeService(service, locale)

    return NextResponse.json({ service: localized })
  } catch (error) {
    console.error('Get service error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}