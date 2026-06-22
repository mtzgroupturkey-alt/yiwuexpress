import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function checkAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

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
    const { name, slug, description, price, duration, coverage, type, image } = body

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