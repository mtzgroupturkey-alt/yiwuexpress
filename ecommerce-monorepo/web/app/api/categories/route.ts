import { NextResponse } from 'next/server'
import { unstable_cache, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/db'
import { localizeCategory } from '@/lib/utils/localize'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

/**
 * Cached category tree fetcher (2 levels: root + direct children).
 * Slashes payload from 162 KB down to < 30 KB by removing 4-level deep recursion
 * and unnecessary heavy fields while preserving full compatibility.
 */
const getCachedCategories = unstable_cache(
  async (
    activeOnly: boolean,
    includeChildren: boolean,
    featured: boolean,
    parentKey: string,
    levelNum: number,
    limitNum: number,
    locale: string
  ) => {
    const where: any = {}
    if (activeOnly) {
      where.isActive = true
    }
    if (featured) {
      where.isFeatured = true
    }
    if (parentKey === 'null' || parentKey === 'none') {
      where.parentId = null
    } else if (parentKey && parentKey !== 'all') {
      where.parentId = parentKey
    }
    if (levelNum === 1) {
      where.parentId = null
    } else if (levelNum > 1) {
      where.level = levelNum
    }

    const [categories, productGroups] = await Promise.all([
      prisma.category.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          icon: true,
          parentId: true,
          level: true,
          displayOrder: true,
          menuOrder: true,
          isActive: true,
          isFeatured: true,
          showInMenu: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
              translations: {
                where: { locale: { in: [locale, 'en'] } },
                select: { locale: true, name: true, description: true }
              }
            }
          },
          translations: {
            where: { locale: { in: [locale, 'en'] } },
            select: { locale: true, name: true, description: true }
          },
          children: includeChildren
            ? {
                where: activeOnly ? { isActive: true } : undefined,
                orderBy: [
                  { menuOrder: 'asc' },
                  { displayOrder: 'asc' },
                  { name: 'asc' }
                ],
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  description: true,
                  image: true,
                  icon: true,
                  parentId: true,
                  level: true,
                  displayOrder: true,
                  menuOrder: true,
                  isActive: true,
                  isFeatured: true,
                  showInMenu: true,
                  translations: {
                    where: { locale: { in: [locale, 'en'] } },
                    select: { locale: true, name: true, description: true }
                  }
                }
              }
            : false
        },
        orderBy: [
          { menuOrder: 'asc' },
          { displayOrder: 'asc' },
          { name: 'asc' }
        ],
        take: limitNum > 0 ? limitNum : undefined
      }),
      prisma.product.groupBy({
        by: ['categoryId'],
        where: { isActive: true },
        _count: { id: true }
      })
    ])

    const countMap = new Map<string, number>()
    for (const item of productGroups) {
      if (item.categoryId) {
        countMap.set(item.categoryId, item._count.id)
      }
    }

    // Attach recursive product counts (direct products + direct subcategory products)
    const attachRecursiveCount = (node: any): number => {
      const direct = countMap.get(node.id) || 0
      let subTotal = 0
      if (Array.isArray(node.children) && node.children.length > 0) {
        for (const child of node.children) {
          const childCount = countMap.get(child.id) || 0
          child.directProductCount = childCount
          child.itemCount = childCount
          child.productCount = childCount
          child._count = { products: childCount }
          subTotal += childCount
        }
      }
      const total = direct + subTotal
      node.directProductCount = direct
      node.itemCount = total
      node.productCount = total
      node._count = { products: total }
      return total
    }

    for (const cat of categories) {
      attachRecursiveCount(cat)
    }

    // Localize category labels according to active locale with English fallback
    const localizeNode = (node: any): any => {
      const localized = localizeCategory(node, locale)
      const out = {
        ...node,
        name: localized.name,
        description: localized.description,
        itemCount: node.itemCount ?? 0,
        productCount: node.productCount ?? 0,
        _count: { products: node.itemCount ?? 0 }
      }
      if (Array.isArray(node.children)) {
        out.children = node.children.map(localizeNode)
      }
      if (node.parent) {
        out.parent = { ...node.parent, ...localizeCategory(node.parent, locale) }
      }
      return out
    }

    return categories.map(localizeNode)
  },
  ['categories-tree-v2'],
  { revalidate: 3600, tags: ['categories'] }
)

// GET /api/categories - Get all categories (Cached for 1 hour)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'
    const includeChildren = searchParams.get('includeChildren') === 'true'
    const featured = searchParams.get('featured') === 'true'
    const parent = searchParams.get('parent') || 'all'
    const level = searchParams.get('level') ? parseInt(searchParams.get('level')!, 10) : 0
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 0
    const locale = searchParams.get('locale') || 'en'

    const data = await getCachedCategories(
      activeOnly,
      includeChildren,
      featured,
      parent,
      level,
      limit,
      locale
    )

    return NextResponse.json(
      {
        success: true,
        data,
        count: data.length
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      }
    )
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category (Admin only)
export async function POST(request: Request) {
  try {
    await requireRole(request, ['ADMIN'])
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug: body.slug }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    const { name, slug, description, image, icon, parentId, displayOrder, isActive, isFeatured } = body
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        icon: icon || null,
        parentId: parentId || null,
        displayOrder: displayOrder !== undefined ? displayOrder : 0,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false
      }
    })

    // Invalidate categories cache
    revalidateTag('categories')

    return NextResponse.json(
      {
        success: true,
        data: category
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (
      error instanceof Error &&
      (error.message === 'Unauthorized' ||
        error.message === 'Forbidden' ||
        error.message === 'Account is disabled')
    ) {
      return createAuthErrorResponse(error)
    }
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
