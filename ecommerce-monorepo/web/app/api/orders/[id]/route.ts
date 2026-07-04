import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth, createAuthErrorResponse } from '@/lib/auth'

const prisma = new PrismaClient()

// GET /api/orders/[id] - Get single order (customer view)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // IDOR Protection: Verify user owns this order or is admin
    const user = await requireAuth(request)
    
    const { id } = params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail: true
              }
            }
          }
        },
        shippingCountry: {
          select: {
            code: true,
            name: true,
            flag: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // IDOR Protection: User can only view their own orders (admins can view all)
    if (order.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
