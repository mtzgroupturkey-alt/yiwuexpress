import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Verify admin authentication
async function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    })

    if (user?.role !== 'ADMIN') {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

// GET /api/admin/products/[id]/variants - Get all variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get all variants
    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      include: {
        tieredPrices: {
          orderBy: { minQuantity: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: variants,
      product
    })
  } catch (error) {
    console.error('Get variants error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variants' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products/[id]/variants - Create a new variant
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Validate required fields
    if (!body.sku || !body.attributes || !body.price) {
      return NextResponse.json(
        { error: 'SKU, attributes, and price are required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if SKU already exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { sku: body.sku }
    })

    if (existingVariant) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 409 }
      )
    }

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        sku: body.sku,
        attributes: body.attributes,
        price: parseFloat(body.price),
        comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : null,
        costPrice: body.costPrice ? parseFloat(body.costPrice) : null,
        stock: parseInt(body.stock) || 0,
        lowStockThreshold: parseInt(body.lowStockThreshold) || 10,
        images: body.images || [],
        isActive: body.isActive !== false
      }
    })

    // Create tiered prices if provided
    if (body.tieredPrices && Array.isArray(body.tieredPrices)) {
      await prisma.tieredPrice.createMany({
        data: body.tieredPrices.map((tier: any) => ({
          variantId: variant.id,
          minQuantity: parseInt(tier.minQuantity),
          maxQuantity: tier.maxQuantity ? parseInt(tier.maxQuantity) : null,
          price: parseFloat(tier.price)
        }))
      })
    }

    // Fetch variant with tiered prices
    const variantWithPrices = await prisma.productVariant.findUnique({
      where: { id: variant.id },
      include: {
        tieredPrices: {
          orderBy: { minQuantity: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: variantWithPrices
    }, { status: 201 })
  } catch (error) {
    console.error('Create variant error:', error)
    return NextResponse.json(
      { error: 'Failed to create variant' },
      { status: 500 }
    )
  }
}
