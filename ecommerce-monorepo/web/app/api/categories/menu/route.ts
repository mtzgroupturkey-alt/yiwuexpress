export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { localizeCategory } from '@/lib/utils/localize'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeChildren = searchParams.get('includeChildren') === 'true'
  const locale = searchParams.get('locale') || 'en'

  const [categories, productGroups] = await Promise.all([
    prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
        showInMenu: true,
      },
      include: {
        translations: {
          where: { locale: { in: [locale, 'en'] } },
          select: { locale: true, name: true, description: true }
        },
        children: includeChildren ? {
          where: {
            isActive: true,
            showInMenu: true,
          },
          include: {
            translations: {
              where: { locale: { in: [locale, 'en'] } },
              select: { locale: true, name: true, description: true }
            },
            children: includeChildren ? {
              where: { isActive: true, showInMenu: true },
              include: {
                translations: {
                  where: { locale: { in: [locale, 'en'] } },
                  select: { locale: true, name: true, description: true }
                }
              },
            } : false,
          },
          orderBy: [
            { menuOrder: 'asc' },
            { displayOrder: 'asc' },
            { name: 'asc' }
          ],
        } : false,
      },
      orderBy: [
        { menuOrder: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' }
      ],
    }),
    prisma.product.groupBy({
      by: ['categoryId'],
      where: { isActive: true },
      _count: { id: true },
    })
  ])

  const countMap = new Map<string, number>()
  for (const item of productGroups) {
    if (item.categoryId) {
      countMap.set(item.categoryId, item._count.id)
    }
  }

  // Calculate recursive product count (direct products + products in child subcategories)
  const attachRecursiveCount = (node: any): number => {
    const direct = countMap.get(node.id) || 0
    let subTotal = 0
    if (Array.isArray(node.children) && node.children.length > 0) {
      for (const child of node.children) {
        subTotal += attachRecursiveCount(child)
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

  // Expand-and-Contract read-path localization: resolve each node's name to the
  // active locale with English fallback (recursively through children).
  const localizeNode = (node: any): any => {
    const localized = localizeCategory(node, locale)
    const out = {
      ...node,
      name: localized.name,
      itemCount: node.itemCount ?? 0,
      productCount: node.productCount ?? 0,
      _count: { products: node.itemCount ?? 0 },
    }
    if (Array.isArray(node.children)) {
      out.children = node.children.map(localizeNode)
    }
    return out
  }

  return NextResponse.json({ data: categories.map(localizeNode) })
}
