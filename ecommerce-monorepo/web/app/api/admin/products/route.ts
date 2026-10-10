export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

// GET /api/admin/products - Get all products (admin view, includes inactive)
export async function GET(request: Request) {
  try {
    await requireRole(request, ['ADMIN'])
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const categorySlug = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const isFeatured = searchParams.get('isFeatured')
    const isNewArrival = searchParams.get('isNewArrival')
    const isFlashSale = searchParams.get('isFlashSale')
    const stockStatus = searchParams.get('stockStatus')
    const hasRealImage = searchParams.get('hasRealImage')
    const availableForRetail = searchParams.get('availableForRetail')
    const availableForWholesale = searchParams.get('availableForWholesale')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    const includeVariants = searchParams.get('includeVariants') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limitParam = searchParams.get('limit')
    
    const MAX_LIMIT = 100
    const DEFAULT_LIMIT = 20

    let parsedLimit = DEFAULT_LIMIT
    if (limitParam && limitParam !== 'all' && limitParam !== 'unlimited' && limitParam !== '-1' && limitParam !== '0') {
      const n = parseInt(limitParam, 10)
      if (!isNaN(n) && n > 0) {
        parsedLimit = Math.min(n, MAX_LIMIT)
      }
    }

    const limit = parsedLimit
    const skip = (page - 1) * limit

    const where: any = {}

    if (search && search.trim().length > 0) {
      const q = search.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { dromkokItemNo: { contains: q, mode: 'insensitive' } },
        { ikeaItemNo: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        {
          translations: {
            some: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ]
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

    if (isActive !== null && isActive !== undefined && isActive !== 'all') {
      where.isActive = isActive === 'true'
    }

    if (isFeatured === 'true') {
      where.isFeatured = true
    } else if (isFeatured === 'false') {
      where.isFeatured = false
    }

    if (isNewArrival === 'true') {
      where.isNewArrival = true
    } else if (isNewArrival === 'false') {
      where.isNewArrival = false
    }

    if (isFlashSale === 'true') {
      where.isFlashSale = true
    } else if (isFlashSale === 'false') {
      where.isFlashSale = false
    }

    if (availableForRetail === 'true') {
      where.availableForRetail = true
    } else if (availableForRetail === 'false') {
      where.availableForRetail = false
    }

    if (availableForWholesale === 'true') {
      where.availableForWholesale = true
    } else if (availableForWholesale === 'false') {
      where.availableForWholesale = false
    }

    if (stockStatus === 'in_stock') {
      where.stock = { gte: 10 }
    } else if (stockStatus === 'low_stock') {
      where.stock = { gt: 0, lt: 10 }
    } else if (stockStatus === 'out_of_stock') {
      where.stock = { lte: 0 }
    }

    if (hasRealImage === 'true') {
      where.hasRealImage = true
    } else if (hasRealImage === 'false') {
      where.hasRealImage = false
    }

    // Configure orderBy
    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'price') {
      orderBy = { price: sortOrder }
    } else if (sortBy === 'stock') {
      orderBy = { stock: sortOrder }
    } else if (sortBy === 'name') {
      orderBy = { name: sortOrder }
    } else if (sortBy === 'updatedAt') {
      orderBy = { updatedAt: sortOrder }
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder }
    }

    // Base where for scoped counts (search + category)
    const baseWhere: any = {}
    if (where.OR) baseWhere.OR = where.OR
    if (where.categoryId) baseWhere.categoryId = where.categoryId

    const [
      products,
      total,
      activeCount,
      featuredCount,
      newArrivalCount,
      flashSaleCount,
      lowStockCount,
      outOfStockCount
    ] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              translations: {
                select: {
                  locale: true,
                  name: true
                }
              },
              parent: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  translations: {
                    select: {
                      locale: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          variants: includeVariants ? {
            where: { 
              isActive: true,
            },
            select: {
              id: true,
              productId: true,
              sku: true,
              attributes: true,
              price: true,
              costPrice: true,
              stock: true,
              isActive: true,
            }
          } : false,
          translations: {
            select: {
              locale: true,
              name: true
            }
          },
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where }),
      prisma.product.count({ where: { ...baseWhere, isActive: true } }),
      prisma.product.count({ where: { ...baseWhere, isFeatured: true } }),
      prisma.product.count({ where: { ...baseWhere, isNewArrival: true } }),
      prisma.product.count({ where: { ...baseWhere, isFlashSale: true } }),
      prisma.product.count({ where: { ...baseWhere, stock: { gt: 0, lt: 10 } } }),
      prisma.product.count({ where: { ...baseWhere, stock: { lte: 0 } } })
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      },
      metrics: {
        total,
        active: activeCount,
        featured: featuredCount,
        newArrival: newArrivalCount,
        flashSale: flashSaleCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount
      }
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
