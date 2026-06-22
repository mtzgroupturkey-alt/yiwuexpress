import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { addCorsHeaders, handleOptions } from '@/lib/api-middleware'

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

export async function GET(request: NextRequest) {
  try {
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

    const response = NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
    return addCorsHeaders(response, request)
  } catch (error) {
    console.error('Get services error:', error)
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return addCorsHeaders(response, request)
  }
}