import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAdminAuth } from '@/lib/admin-middleware'

// GET /api/admin/returns - List all returns
async function getReturnsHandler(request: any) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { returnNumber: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Get returns with relations
    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              customerName: true,
              customerEmail: true,
              total: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.return.count({ where }),
    ])

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get returns error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(getReturnsHandler)
