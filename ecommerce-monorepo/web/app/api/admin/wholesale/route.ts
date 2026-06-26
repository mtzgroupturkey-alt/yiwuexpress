import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/wholesale - List all wholesale inquiries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
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
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get wholesale inquiries with pagination
    const [inquiries, total] = await Promise.all([
      prisma.wholesaleInquiry.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true
            }
          },
          shippingCountry: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.wholesaleInquiry.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: inquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching wholesale inquiries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wholesale inquiries' },
      { status: 500 }
    )
  }
}
