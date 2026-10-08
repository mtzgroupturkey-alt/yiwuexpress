export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

async function getAdminPayload(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') return null
  return payload
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const admin = await getAdminPayload(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviewId = params.id
    const body = await req.json().catch(() => ({}))
    const { comment } = body

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 })
    }

    // Ensure review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    })
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Verify admin user exists in DB
    let userId = admin.userId
    let userExists = await prisma.user.findUnique({ where: { id: userId } })
    if (!userExists) {
      const anyAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
      if (anyAdmin) {
        userId = anyAdmin.id
      }
    }

    const reply = await prisma.reviewReply.create({
      data: {
        reviewId,
        userId,
        comment: comment.trim(),
        isAdminReply: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: reply }, { status: 201 })
  } catch (error) {
    console.error('Error adding admin review reply:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminPayload(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    let replyId = searchParams.get('replyId')

    if (!replyId) {
      const body = await req.json().catch(() => ({}))
      replyId = body?.replyId
    }

    if (!replyId) {
      return NextResponse.json({ error: 'replyId is required' }, { status: 400 })
    }

    await prisma.reviewReply.delete({
      where: { id: replyId }
    })

    return NextResponse.json({ success: true, message: 'Reply deleted' })
  } catch (error) {
    console.error('Error deleting review reply:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
