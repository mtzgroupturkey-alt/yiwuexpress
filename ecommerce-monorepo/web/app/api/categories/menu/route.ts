export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { localizeCategory } from '@/lib/utils/localize'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeChildren = searchParams.get('includeChildren') === 'true'
  const locale = searchParams.get('locale') || 'en'

  const categories = await prisma.category.findMany({
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
        orderBy: { menuOrder: 'asc' },
      } : false,
    },
    orderBy: { menuOrder: 'asc' },
  })

  // Expand-and-Contract read-path localization: resolve each node's name to the
  // active locale with English fallback (recursively through children).
  const localizeNode = (node: any): any => {
    const localized = localizeCategory(node, locale)
    const out = { ...node, name: localized.name }
    if (Array.isArray(node.children)) {
      out.children = node.children.map(localizeNode)
    }
    return out
  }

  return NextResponse.json({ data: categories.map(localizeNode) })
}
