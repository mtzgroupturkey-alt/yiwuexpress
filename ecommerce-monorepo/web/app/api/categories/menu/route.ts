import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeChildren = searchParams.get('includeChildren') === 'true'

  const categories = await prisma.category.findMany({
    where: {
      parentId: null,
      isActive: true,
      showInMenu: true,
    },
    include: {
      children: includeChildren ? {
        where: {
          isActive: true,
          showInMenu: true,
        },
        include: {
          children: includeChildren ? {
            where: { isActive: true, showInMenu: true },
          } : false,
        },
        orderBy: { menuOrder: 'asc' },
      } : false,
    },
    orderBy: { menuOrder: 'asc' },
  })

  return NextResponse.json({ data: categories })
}
