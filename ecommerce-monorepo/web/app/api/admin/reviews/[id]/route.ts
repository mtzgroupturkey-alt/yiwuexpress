import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

async function checkAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const payload = token ? verifyToken(token) : null
  return payload && payload.role === 'ADMIN'
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    if (!await checkAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviewId = params.id
    const body = await req.json().catch(() => ({}))
    const { isApproved } = body

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: isApproved !== undefined ? !!isApproved : true }
    })

    return NextResponse.json({ success: true, data: updatedReview })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    if (!await checkAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviewId = params.id
    await prisma.review.delete({
      where: { id: reviewId }
    })

    return NextResponse.json({ success: true, message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
