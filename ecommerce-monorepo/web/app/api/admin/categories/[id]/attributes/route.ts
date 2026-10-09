export const dynamic = 'force-dynamic';
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

    const onlyVisible = req.nextUrl.searchParams.get('onlyVisible') === 'true'

    // 1. Get direct CategoryAttribute records for this category
    const directAttributes = await prisma.categoryAttribute.findMany({
      where: {
        categoryId: params.id,
      },
      include: {
        attribute: {
          include: {
            translations: true,
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    // Map of child category overrides by attributeId
    const directAttrMap = new Map(directAttributes.map((ca) => [ca.attributeId, ca]))

    // 2. Get inherited attributes from parent (if exists)
    let inheritedAttributes: any[] = []
    if (category.parentId) {
      const parentAttributes = await prisma.categoryAttribute.findMany({
        where: {
          categoryId: category.parentId,
        },
        include: {
          attribute: {
            include: {
              translations: true,
            },
          },
          category: {
            select: { name: true },
          },
        },
        orderBy: {
          displayOrder: 'asc',
        },
      })

      inheritedAttributes = parentAttributes.map((ca) => {
        const override = directAttrMap.get(ca.attributeId)
        if (override) {
          // Child category explicitly overrides this inherited attribute
          directAttrMap.delete(ca.attributeId)
          return {
            ...ca.attribute,
            categoryAttributeId: override.id,
            displayOrder: override.displayOrder,
            isVisible: override.isVisible && ca.attribute.isActive !== false,
            isRequired: override.isRequired,
            isInherited: true,
            inheritedFrom: ca.category.name,
            hasOverride: true,
          }
        }

        // Standard inheritance from parent
        return {
          ...ca.attribute,
          categoryAttributeId: ca.id,
          displayOrder: ca.displayOrder,
          isVisible: ca.isVisible && ca.attribute.isActive !== false,
          isRequired: ca.isRequired,
          isInherited: true,
          inheritedFrom: ca.category.name,
          hasOverride: false,
        }
      })
    }

    // 3. Map remaining direct attributes (not overriding any inherited attribute)
    const directAttrs = Array.from(directAttrMap.values()).map((ca) => ({
      ...ca.attribute,
      categoryAttributeId: ca.id,
      displayOrder: ca.displayOrder,
      isVisible: ca.isVisible && ca.attribute.isActive !== false,
      isRequired: ca.isRequired,
      isInherited: false,
    }))

    // Combine: inherited first, then direct attributes
    let allAttributes = [...inheritedAttributes, ...directAttrs]
    if (onlyVisible) {
      allAttributes = allAttributes.filter((a) => a.isVisible !== false && a.isActive !== false)
    }

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
