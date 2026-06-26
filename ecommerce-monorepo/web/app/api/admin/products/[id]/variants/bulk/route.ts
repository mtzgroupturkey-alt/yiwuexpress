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

// Generate all combinations of attributes
function generateCombinations(attributes: Array<{ name: string; values: string[] }>): Array<Record<string, string>> {
  if (attributes.length === 0) return [{}]
  if (attributes.length === 1) {
    return attributes[0].values.map(value => ({ [attributes[0].name]: value }))
  }

  const [first, ...rest] = attributes
  const restCombinations = generateCombinations(rest)
  
  const combinations: Array<Record<string, string>> = []
  for (const value of first.values) {
    for (const combination of restCombinations) {
      combinations.push({
        [first.name]: value,
        ...combination
      })
    }
  }
  
  return combinations
}

// Generate SKU from attributes
function generateSKU(baseSKU: string, attributes: Record<string, string>): string {
  const attributeCode = Object.values(attributes)
    .map(v => v.substring(0, 3).toUpperCase())
    .join('-')
  return `${baseSKU}-${attributeCode}`
}

// POST /api/admin/products/[id]/variants/bulk - Bulk create variants
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
    if (!body.attributes || !Array.isArray(body.attributes) || body.attributes.length === 0) {
      return NextResponse.json(
        { error: 'Attributes array is required' },
        { status: 400 }
      )
    }

    if (!body.basePrice) {
      return NextResponse.json(
        { error: 'Base price is required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, sku: true, name: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Generate all combinations
    const combinations = generateCombinations(body.attributes)

    if (combinations.length === 0) {
      return NextResponse.json(
        { error: 'No combinations generated' },
        { status: 400 }
      )
    }

    // Check if we would exceed reasonable limits
    if (combinations.length > 100) {
      return NextResponse.json(
        { 
          error: 'Too many combinations',
          count: combinations.length,
          message: 'Maximum 100 variants can be created at once'
        },
        { status: 400 }
      )
    }

    // Create variants
    const createdVariants = []
    const errors = []

    for (const combination of combinations) {
      try {
        const sku = generateSKU(product.sku, combination)

        // Check if SKU already exists
        const existing = await prisma.productVariant.findUnique({
          where: { sku }
        })

        if (existing) {
          errors.push({
            sku,
            attributes: combination,
            error: 'SKU already exists'
          })
          continue
        }

        // Create variant
        const variant = await prisma.productVariant.create({
          data: {
            productId: id,
            sku,
            attributes: combination,
            price: parseFloat(body.basePrice),
            comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : null,
            costPrice: body.costPrice ? parseFloat(body.costPrice) : null,
            stock: parseInt(body.defaultStock) || 0,
            lowStockThreshold: parseInt(body.lowStockThreshold) || 10,
            images: body.defaultImages || [],
            isActive: true
          }
        })

        createdVariants.push(variant)
      } catch (error) {
        errors.push({
          sku: generateSKU(product.sku, combination),
          attributes: combination,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created: createdVariants.length,
        errors: errors.length,
        variants: createdVariants,
        errorDetails: errors
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Bulk create variants error:', error)
    return NextResponse.json(
      { error: 'Failed to create variants' },
      { status: 500 }
    )
  }
}
