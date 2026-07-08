import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const now = new Date()

    // Get active flash sale products
    const products = await prisma.product.findMany({
      where: {
        isFlashSale: true,
        isActive: true,
        flashSaleStart: {
          lte: now,
        },
        flashSaleEnd: {
          gte: now,
        },
        OR: [
          { flashSaleStock: null },
          { flashSaleStock: { gt: 0 } },
        ],
      },
      orderBy: { flashSaleOrder: 'asc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    // Calculate additional metadata for each product
    const enrichedProducts = products.map((product) => {
      const discount = product.flashSalePrice
        ? Math.round(((product.price - product.flashSalePrice) / product.price) * 100)
        : 0

      const timeRemaining = product.flashSaleEnd
        ? new Date(product.flashSaleEnd).getTime() - now.getTime()
        : 0

      return {
        ...product,
        discount,
        timeRemaining,
        hasLimitedStock: product.flashSaleStock !== null,
        stockRemaining: product.flashSaleStock,
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedProducts,
      count: enrichedProducts.length,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching flash sale products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flash sale products' },
      { status: 500 }
    )
  }
}
