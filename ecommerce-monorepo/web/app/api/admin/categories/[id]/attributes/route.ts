import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the category to check if it has a parent
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      select: { id: true, parentId: true, name: true },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get direct attributes for this category
    const directAttributes = await prisma.categoryAttribute.findMany({
      where: {
        categoryId: params.id,
      },
      include: {
        attribute: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    // Get inherited attributes from parent (if exists)
    let inheritedAttributes: any[] = []
    if (category.parentId) {
      const parentAttributes = await prisma.categoryAttribute.findMany({
        where: {
          categoryId: category.parentId,
        },
        include: {
          attribute: true,
          category: {
            select: { name: true },
          },
        },
        orderBy: {
          displayOrder: 'asc',
        },
      })

      inheritedAttributes = parentAttributes.map((ca) => ({
        ...ca.attribute,
        categoryAttributeId: ca.id,
        displayOrder: ca.displayOrder,
        isVisible: ca.isVisible,
        isRequired: ca.isRequired,
        isInherited: true,
        inheritedFrom: ca.category.name,
      }))
    }

    // Map direct attributes
    const attributes = directAttributes.map((ca) => ({
      ...ca.attribute,
      categoryAttributeId: ca.id,
      displayOrder: ca.displayOrder,
      isVisible: ca.isVisible,
      isRequired: ca.isRequired,
      isInherited: false,
    }))

    // Combine: inherited first, then direct attributes
    const allAttributes = [...inheritedAttributes, ...attributes]

    return NextResponse.json({ 
      data: allAttributes,
      category: {
        id: category.id,
        name: category.name,
        hasParent: !!category.parentId,
      }
    })
  } catch (error) {
    console.error('Error fetching category attributes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category attributes' },
      { status: 500 }
    )
  }
}
