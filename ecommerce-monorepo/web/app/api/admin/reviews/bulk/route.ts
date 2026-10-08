export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

async function checkAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const payload = token ? verifyToken(token) : null
  return payload && payload.role === 'ADMIN'
}

export async function POST(req: NextRequest) {
  return handleBulk(req)
}

export async function PATCH(req: NextRequest) {
  return handleBulk(req)
}

async function handleBulk(req: NextRequest) {
  try {
    if (!await checkAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required and must not be empty' }, { status: 400 })
    }

    if (action === 'APPROVE') {
      const result = await prisma.review.updateMany({
        where: { id: { in: ids } },
        data: { isApproved: true }
      })
      return NextResponse.json({ success: true, count: result.count, action })
    }

    if (action === 'UNAPPROVE') {
      const result = await prisma.review.updateMany({
        where: { id: { in: ids } },
        data: { isApproved: false }
      })
      return NextResponse.json({ success: true, count: result.count, action })
    }

    if (action === 'DELETE') {
      const result = await prisma.review.deleteMany({
        where: { id: { in: ids } }
      })
      return NextResponse.json({ success: true, count: result.count, action })
    }

    return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 })
  } catch (error) {
    console.error('Error executing bulk review action:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
