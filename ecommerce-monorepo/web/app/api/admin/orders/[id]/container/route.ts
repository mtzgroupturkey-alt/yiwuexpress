export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { containerId, isDirectSale } = await req.json()

    if (!containerId) {
      return NextResponse.json({ error: 'Container ID required' }, { status: 400 })
    }

    const container = await prisma.container.findUnique({
      where: { id: containerId },
    })

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    // Update order and container
    const [order] = await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: {
          containerId,
          containerNumber: container.containerNumber,
          status: 'PROCESSING',
          salesType: isDirectSale ? 'DIRECT_CONTAINER' : undefined,
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          shippingCountry: { select: { id: true, code: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, thumbnail: true, sku: true } },
            },
          },
        },
      }),
      ...(isDirectSale ? [
        prisma.container.update({
          where: { id: containerId },
          data: {
            shipToCustomerDirectly: true,
            directOrderId: id,
          },
        }),
      ] : []),
    ])

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Error assigning container:', error)
    return NextResponse.json({ error: 'Failed to assign container' }, { status: 500 })
  }
}
