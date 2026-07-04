import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const container = await prisma.container.findUnique({
      where: { id: params.id },
      include: {
        shippingMethod: true,
        orders: {
          include: {
            items: {
              select: {
                id: true,
                productName: true,
                quantity: true,
                total: true,
              },
            },
          },
        },
      },
    })

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    return NextResponse.json({ data: container })
  } catch (error) {
    console.error('Error fetching container:', error)
    return NextResponse.json({ error: 'Failed to fetch container' }, { status: 500 })
  }
}
