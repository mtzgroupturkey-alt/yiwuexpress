import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const payload = token ? verifyToken(token) : null
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        product: {
          select: {
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ success: true, data: reviews })
  } catch (error) {
    console.error('Error fetching admin reviews:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
