import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { isNewArrival: true },
      orderBy: { newArrivalOrder: 'asc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: products,
    })
  } catch (error) {
    console.error('Error fetching new arrivals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch new arrivals' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { products } = await req.json()

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format' },
        { status: 400 }
      )
    }

    // Update new arrival order for all products
    const updates = products.map((item: { id: string; order: number }, index: number) =>
      prisma.product.update({
        where: { id: item.id },
        data: { newArrivalOrder: index },
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({
      success: true,
      message: 'New arrivals order updated',
    })
  } catch (error) {
    console.error('Error updating new arrivals order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update new arrivals order' },
      { status: 500 }
    )
  }
}
