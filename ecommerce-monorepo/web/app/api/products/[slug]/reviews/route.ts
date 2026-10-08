export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken, hashPassword } from '@/lib/auth'

async function getProductByIdOrSlug(idOrSlug: string) {
  return prisma.product.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    }
  })
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  try {
    const product = await getProductByIdOrSlug(params.slug)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const productId = product.id
    
    // Optional auth checking for admin views
    const token = getTokenFromRequest(req)
    const payload = token ? verifyToken(token) : null
    const isAdmin = payload?.role === 'ADMIN'

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        ...(isAdmin ? {} : { isApproved: true })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ success: true, data: reviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  try {
    const product = await getProductByIdOrSlug(params.slug)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const productId = product.id
    const token = getTokenFromRequest(req)
    const payload = token ? verifyToken(token) : null

    const body = await req.json()
    const { rating, title, comment, reviewerName, images = [] } = body

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      return NextResponse.json({ error: 'Title must be at least 2 characters' }, { status: 400 })
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      return NextResponse.json({ error: 'Comment must be at least 3 characters' }, { status: 400 })
    }

    let userId = payload?.userId
    let isVerifiedPurchase = false

    if (userId) {
      // Check if verified purchase for logged in user
      const verifiedOrder = await prisma.order.findFirst({
        where: {
          userId,
          status: { notIn: ['CANCELLED', 'FAILED', 'PENDING'] },
          items: {
            some: {
              productId
            }
          }
        }
      })
      isVerifiedPurchase = !!verifiedOrder
    } else {
      // Guest submission: find or create guest user
      const guestName = (reviewerName && typeof reviewerName === 'string' && reviewerName.trim())
        ? reviewerName.trim()
        : 'Guest Customer'
      const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@dromkok.com`

      const guestUser = await prisma.user.create({
        data: {
          name: guestName,
          email: guestEmail,
          password: await hashPassword('guest_' + Math.random().toString(36)),
          role: 'USER',
        }
      })
      userId = guestUser.id
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        images,
        isVerifiedPurchase,
        isApproved: true, // Auto-approve so it shows immediately
        helpfulCount: 0
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
