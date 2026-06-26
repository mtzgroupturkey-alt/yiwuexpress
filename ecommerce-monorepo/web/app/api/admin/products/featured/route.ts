import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      orderBy: { featuredOrder: 'asc' },
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
    console.error('Error fetching featured products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured products' },
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

    // Update featured order for all products
    const updates = products.map((item: { id: string; order: number }, index: number) =>
      prisma.product.update({
        where: { id: item.id },
        data: { featuredOrder: index },
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({
      success: true,
      message: 'Featured products order updated',
    })
  } catch (error) {
    console.error('Error updating featured products order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update featured products order' },
      { status: 500 }
    )
  }
}
