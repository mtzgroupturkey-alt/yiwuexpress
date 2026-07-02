import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/products - Get all products with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const newArrivals = searchParams.get('new')
    const colors = searchParams.getAll('color') // Get color filters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true
    }

    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        include: {
          children: {
            include: {
              children: {
                include: {
                  children: true
                }
              }
            }
          }
        }
      })
      if (category) {
        // Get all descendant category IDs (including the selected category)
        const categoryIds = [category.id]
        const collectChildIds = (cat: any) => {
          if (cat.children && cat.children.length > 0) {
            cat.children.forEach((child: any) => {
              categoryIds.push(child.id)
              collectChildIds(child)
            })
          }
        }
        collectChildIds(category)
        
        // Filter by category and all its descendants
        where.categoryId = { in: categoryIds }
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Color filter
    if (colors && colors.length > 0) {
      where.attributeValues = {
        some: {
          attribute: {
            type: { in: ['COLOR', 'COLOR_MULTI'] }
          },
          OR: colors.map(color => ({
            value: { contains: color }
          }))
        }
      }
    }

    if (featured === 'true') {
      where.isFeatured = true
    }

    if (newArrivals === 'true') {
      where.isNewArrival = true
    }

    // Determine ordering based on query params
    let orderBy: any = []
    
    if (featured === 'true') {
      orderBy.push({ featuredOrder: 'asc' })
    } else if (newArrivals === 'true') {
      orderBy.push({ newArrivalOrder: 'asc' })
    } else {
      orderBy = [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ]
    }

    // Get total count
    const total = await prisma.product.count({ where })

    // Get products
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product (Admin only)
export async function POST(request: Request) {
  try {
    // TODO: Add authentication check for admin
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['sku', 'name', 'slug', 'price', 'weightKg']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Check if SKU or slug already exists
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: body.sku },
          { slug: body.slug }
        ]
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Product with this SKU or slug already exists' },
        { status: 400 }
      )
    }

    // Extract attributes from body
    const { attributes, ...productData } = body

    // Create product
    const product = await prisma.product.create({
      data: productData,
      include: {
        category: true
      }
    })

    // If attributes are provided, fetch attribute IDs and create attribute values
    if (attributes && Object.keys(attributes).length > 0) {
      // Get all attributes by slug
      const attributeSlugs = Object.keys(attributes)
      const attributeRecords = await prisma.attribute.findMany({
        where: {
          slug: { in: attributeSlugs }
        }
      })

      // Create attribute values
      const attributeValueData = attributeRecords
        .map(attr => {
          const value = attributes[attr.slug]
          if (value !== undefined && value !== null && value !== '') {
            return {
              attributeId: attr.id,
              productId: product.id,
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

    // Fetch product with attribute values
    const productWithAttributes = await prisma.product.findUnique({
      where: { id: product.id },
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
      data: productWithAttributes
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
