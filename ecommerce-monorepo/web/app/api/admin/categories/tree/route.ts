import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Get all active categories with full details
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { menuOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    // Build hierarchical tree structure
    const categoryMap = new Map()
    const rootCategories: any[] = []

    // First pass: create map of all categories with product count
    categories.forEach(cat => {
      categoryMap.set(cat.id, { 
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        icon: cat.icon,
        level: cat.level,
        displayOrder: cat.displayOrder,
        menuOrder: cat.menuOrder,
        isActive: cat.isActive,
        showInMenu: cat.showInMenu,
        isFeatured: cat.isFeatured,
        parentId: cat.parentId,
        productCount: cat._count.products,
        children: [] 
      })
    })

    // Second pass: build tree
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId)
        if (parent) {
          parent.children.push(category)
        } else {
          // Parent not found or inactive, add to root
          rootCategories.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })

    // Sort children by menuOrder
    const sortChildren = (cats: any[]) => {
      cats.sort((a, b) => a.menuOrder - b.menuOrder)
      cats.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
          sortChildren(cat.children)
        }
      })
    }
    sortChildren(rootCategories)

    return NextResponse.json({
      success: true,
      data: rootCategories
    })
  } catch (error) {
    console.error('Error fetching category tree:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category tree' },
      { status: 500 }
    )
  }
}
