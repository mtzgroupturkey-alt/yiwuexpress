import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/products/[id] - Get single product (admin view)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        attributeValues: {
          include: {
            attribute: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Transform attributeValues array into a key-value object for easier form handling
    const attributes: Record<string, any> = {}
    product.attributeValues.forEach(av => {
      try {
        // Try to parse as JSON first (for arrays and objects)
        attributes[av.attribute.slug] = JSON.parse(av.value)
      } catch {
        // If not JSON, use as string
        attributes[av.attribute.slug] = av.value
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        attributes
      }
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // If SKU or slug is being changed, check for conflicts
    if (body.sku && body.sku !== existing.sku) {
      const skuConflict = await prisma.product.findFirst({
        where: {
          sku: body.sku,
          id: { not: id }
        }
      })
      if (skuConflict) {
        return NextResponse.json(
          { success: false, error: 'SKU already exists' },
          { status: 400 }
        )
      }
    }

    if (body.slug && body.slug !== existing.slug) {
      const slugConflict = await prisma.product.findFirst({
        where: {
          slug: body.slug,
          id: { not: id }
        }
      })
      if (slugConflict) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    // Extract attributes from body
    const { attributes, ...productData } = body

    // Update product
    const updated = await prisma.product.update({
      where: { id },
      data: productData,
      include: {
        category: true
      }
    })

    // Handle attribute values update
    if (attributes && typeof attributes === 'object') {
      // Delete existing attribute values for this product
      await prisma.attributeValue.deleteMany({
        where: { productId: id }
      })

      // Get all attributes by slug
      const attributeSlugs = Object.keys(attributes)
      if (attributeSlugs.length > 0) {
        const attributeRecords = await prisma.attribute.findMany({
          where: {
            slug: { in: attributeSlugs }
          }
        })

        // Create new attribute values
        const attributeValueData = attributeRecords
          .map(attr => {
            const value = attributes[attr.slug]
            if (value !== undefined && value !== null && value !== '') {
              return {
                attributeId: attr.id,
                productId: id,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value)
              }
            }
            return null
          })
          .filter(Boolean)

        if (attributeValueData.length > 0) {
          await prisma.attributeValue.createMany({
            data: attributeValueData as any[]
          })
        }
      }
    }

    // Fetch updated product with attribute values
    const productWithAttributes = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        attributeValues: {
          include: {
            attribute: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: productWithAttributes,
      message: 'Product updated successfully'
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if product has associated orders
    const orderCount = await prisma.orderItem.count({
      where: { productId: id }
    })

    if (orderCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete product with existing orders. Consider marking it as inactive instead.' 
        },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
