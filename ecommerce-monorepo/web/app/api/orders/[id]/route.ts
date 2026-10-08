export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser, requireAuth, createAuthErrorResponse } from '@/lib/auth'

// GET /api/orders/[id] - Get single order (customer view)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    const { id } = params
    const { searchParams } = new URL(request.url)
    const orderNumberParam = searchParams.get('orderNumber')
    const emailParam = searchParams.get('email')

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
                thumbnail: true,
                dromkokItemNo: true,
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

    // IDOR Protection: User can view if:
    // 1. Authenticated as the order owner or ADMIN
    // 2. Or provided BOTH matching orderNumber AND customerEmail (guest verification)
    const isOwnerOrAdmin = Boolean(user && (order.userId === user.id || user.role === 'ADMIN'))
    const isGuestVerified = Boolean(
      orderNumberParam &&
      emailParam &&
      orderNumberParam.trim().toLowerCase() === order.orderNumber.trim().toLowerCase() &&
      emailParam.trim().toLowerCase() === order.customerEmail.trim().toLowerCase()
    )

    if (!isOwnerOrAdmin && !isGuestVerified) {
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required to view this order' },
          { status: 401 }
        )
      }
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
