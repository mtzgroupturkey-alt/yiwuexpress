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
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { 
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }},
        { service: { name: { contains: search, mode: 'insensitive' } }},
      ]
    }

    // Get quotes with pagination
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              companyName: true,
              businessType: true,
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          }
        },
      }),
      prisma.quote.count({ where }),
    ])

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get quotes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}