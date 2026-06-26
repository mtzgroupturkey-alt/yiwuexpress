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

// GET /api/admin/products/[id]/variants/[variantId] - Get single variant
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, variantId } = params

    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id
      },
      include: {
        tieredPrices: {
          orderBy: { minQuantity: 'asc' }
        },
        product: {
          select: { id: true, name: true, sku: true }
        }
      }
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: variant
    })
  } catch (error) {
    console.error('Get variant error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variant' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id]/variants/[variantId] - Update variant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, variantId } = params
    const body = await request.json()

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id
      }
    })

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // If SKU is being changed, check for conflicts
    if (body.sku && body.sku !== existingVariant.sku) {
      const skuExists = await prisma.productVariant.findUnique({
        where: { sku: body.sku }
      })

      if (skuExists) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 409 }
        )
      }
    }

    // Update variant
    const updateData: any = {}
    if (body.sku) updateData.sku = body.sku
    if (body.attributes) updateData.attributes = body.attributes
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    if (body.comparePrice !== undefined) {
      updateData.comparePrice = body.comparePrice ? parseFloat(body.comparePrice) : null
    }
    if (body.costPrice !== undefined) {
      updateData.costPrice = body.costPrice ? parseFloat(body.costPrice) : null
    }
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock)
    if (body.lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = parseInt(body.lowStockThreshold)
    }
    if (body.images) updateData.images = body.images
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
      include: {
        tieredPrices: {
          orderBy: { minQuantity: 'asc' }
        }
      }
    })

    // Update tiered prices if provided
    if (body.tieredPrices && Array.isArray(body.tieredPrices)) {
      // Delete existing tiered prices
      await prisma.tieredPrice.deleteMany({
        where: { variantId }
      })

      // Create new tiered prices
      if (body.tieredPrices.length > 0) {
        await prisma.tieredPrice.createMany({
          data: body.tieredPrices.map((tier: any) => ({
            variantId,
            minQuantity: parseInt(tier.minQuantity),
            maxQuantity: tier.maxQuantity ? parseInt(tier.maxQuantity) : null,
            price: parseFloat(tier.price)
          }))
        })
      }
    }

    // Fetch updated variant with tiered prices
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        tieredPrices: {
          orderBy: { minQuantity: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedVariant
    })
  } catch (error) {
    console.error('Update variant error:', error)
    return NextResponse.json(
      { error: 'Failed to update variant' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id]/variants/[variantId] - Delete variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, variantId } = params

    // Check if variant exists
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id
      }
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // Check if variant is used in any orders or carts
    const usedInOrders = await prisma.orderItem.count({
      where: { variantId }
    })

    const usedInCarts = await prisma.cartItem.count({
      where: { variantId }
    })

    if (usedInOrders > 0 || usedInCarts > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete variant that is used in orders or carts',
          usedInOrders,
          usedInCarts
        },
        { status: 409 }
      )
    }

    // Delete tiered prices first (cascade should handle this, but explicit is better)
    await prisma.tieredPrice.deleteMany({
      where: { variantId }
    })

    // Delete variant
    await prisma.productVariant.delete({
      where: { id: variantId }
    })

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully'
    })
  } catch (error) {
    console.error('Delete variant error:', error)
    return NextResponse.json(
      { error: 'Failed to delete variant' },
      { status: 500 }
    )
  }
}
