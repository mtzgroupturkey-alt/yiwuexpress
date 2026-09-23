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
    const includeVariants = searchParams.get('includeVariants') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limitParam = searchParams.get('limit')
    const isFetchAll = limitParam === 'all' || limitParam === '-1'
    const limit = isFetchAll ? -1 : Math.max(1, parseInt(limitParam || '20', 10))
    const skip = isFetchAll ? 0 : (page - 1) * limit

    const where: any = {}

    if (search && search.trim().length > 0) {
      const q = search.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
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

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [products, total, activeCount, featuredCount, lowStockCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              parent: {
                select: {
                  id: true,
                  name: true,
                  slug: true
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
        orderBy: {
          createdAt: 'desc'
        },
        ...(isFetchAll ? {} : { skip, take: limit })
      }),
      prisma.product.count({ where }),
      prisma.product.count({ where: { ...where, isActive: true } }),
      prisma.product.count({ where: { ...where, isFeatured: true } }),
      prisma.product.count({ where: { ...where, stock: { lt: 10 } } })
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit: isFetchAll ? total : limit,
        total,
        pages: isFetchAll ? 1 : Math.max(1, Math.ceil(total / limit))
      },
      metrics: {
        total,
        active: activeCount,
        featured: featuredCount,
        lowStock: lowStockCount
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
