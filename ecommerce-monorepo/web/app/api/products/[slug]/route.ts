import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/products/[slug] - Get single product by slug
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const product = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [
          { id: slug },
          { slug: slug }
        ]
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            attributes: {
              where: {
                isVisible: true
              },
              orderBy: {
                displayOrder: 'asc'
              },
              include: {
                attribute: true
              }
            },
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
                attributes: {
                  where: {
                    isVisible: true
                  },
                  orderBy: {
                    displayOrder: 'asc'
                  },
                  include: {
                    attribute: true
                  }
                }
              }
            }
          }
        },
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

    if (!product.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product not available' },
        { status: 404 }
      )
    }

    // Transform attributeValues array into a key-value object
    const attributes: Record<string, any> = {}
    if (product.attributeValues && Array.isArray(product.attributeValues)) {
      product.attributeValues.forEach((av: any) => {
        try {
          // Try to parse as JSON first (for arrays and objects)
          attributes[av.attribute.slug] = JSON.parse(av.value)
        } catch {
          // If not JSON, use as string
          attributes[av.attribute.slug] = av.value
        }
      })
    }

    // Helper to flatten CategoryAttribute join-table rows into the shape the frontend expects
    const flattenCategoryAttrs = (catAttrs: any[]) =>
      catAttrs
        .filter((ca: any) => ca.attribute) // safety check
        .map((ca: any) => ({
          id: ca.attribute.id,
          slug: ca.attribute.slug,
          name: ca.attribute.name,
          inputType: ca.attribute.type,   // Attribute.type is the inputType
          isRequired: ca.isRequired ?? ca.attribute.isRequired,
          isFilterable: ca.attribute.isFilterable,
          isVisible: ca.isVisible,
          displayOrder: ca.displayOrder ?? ca.attribute.displayOrder,
          options: ca.attribute.options,
        }))

    // Combine parent and current category attributes
    const parentAttributes = flattenCategoryAttrs(product.category?.parent?.attributes || [])
    const currentAttributes = flattenCategoryAttrs(product.category?.attributes || [])
    
    // Merge attributes - parent first, then current category
    // Deduplicate by slug (current category attributes override parent)
    const allAttributes = [...parentAttributes, ...currentAttributes]
    const uniqueAttributes = allAttributes.reduce((acc: any[], attr: any) => {
      // If attribute with same slug doesn't exist, add it
      // If it exists, the later one (from current category) will be kept
      const existingIndex = acc.findIndex(a => a.slug === attr.slug)
      if (existingIndex === -1) {
        acc.push(attr)
      } else {
        acc[existingIndex] = attr // Override with current category's version
      }
      return acc
    }, [])


    // Format the response to include categoryAttributes in the expected format
    const formattedProduct = {
      ...product,
      attributes,
      categoryAttributes: uniqueAttributes
    }

    return NextResponse.json({
      success: true,
      data: formattedProduct
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
