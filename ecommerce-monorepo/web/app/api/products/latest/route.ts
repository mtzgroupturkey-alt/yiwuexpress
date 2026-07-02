import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '12')

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Newest first
      },
      take: limit,
    })

    // Format products for frontend
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      thumbnail: product.thumbnail,
      images: product.images || [],
      stock: product.stock,
      sku: product.sku,
      description: product.description,
      category: product.category,
      createdAt: product.createdAt,
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival,
    }))

    return NextResponse.json({ 
      success: true,
      data: formattedProducts 
    })
  } catch (error) {
    console.error('Error fetching latest products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch latest products' },
      { status: 500 }
    )
  }
}
