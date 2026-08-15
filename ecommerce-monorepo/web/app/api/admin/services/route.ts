export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

type ServiceTranslationInput = {
  locale: string
  name: string
  description?: string | null
  coverage?: string | null
  duration?: string | null
}

// Always seed `en` from legacy fields so the fallback chain stays intact.
function buildServiceTranslations(
  translations: ServiceTranslationInput[] | undefined,
  legacy: { name: string; description?: string | null; coverage?: string | null; duration?: string | null }
): ServiceTranslationInput[] {
  const rows: ServiceTranslationInput[] = []
  const seen = new Set<string>()

  if (Array.isArray(translations)) {
    for (const t of translations) {
      if (!t.locale || seen.has(t.locale)) continue
      seen.add(t.locale)
      rows.push({
        locale: t.locale,
        name: t.name ?? legacy.name,
        description: t.description ?? null,
        coverage: t.coverage ?? null,
        duration: t.duration ?? null,
      })
    }
  }

  if (!seen.has('en')) {
    rows.push({
      locale: 'en',
      name: legacy.name,
      description: legacy.description ?? null,
      coverage: legacy.coverage ?? null,
      duration: legacy.duration ?? null,
    })
  }

  return rows
}

async function checkAdminAuth(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const payload = verifyToken(token)
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  return null // No error
}

export async function GET(request: NextRequest) {
  try {
    const authError = await checkAdminAuth(request)
    if (authError) return authError

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (type) {
      where.type = type
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { coverage: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get services with pagination
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { translations: true },
      }),
      prisma.service.count({ where }),
    ])

    return NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await checkAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { name, slug, description, price, duration, coverage, type, image, translations } = body

    if (!name || !slug || !price || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, price, type' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingService = await prisma.service.findUnique({
      where: { slug }
    })

    if (existingService) {
      return NextResponse.json(
        { error: 'Service with this slug already exists' },
        { status: 400 }
      )
    }

    const service = await prisma.service.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        duration,
        coverage,
        type,
        image,
        isActive: true,
        translations: {
          create: buildServiceTranslations(translations, { name, description, coverage, duration })
        }
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}