export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { isVisible, categoryId, applyToAllCategories } = body

    if (categoryId && !applyToAllCategories) {
      // Per-category override (supports direct and inherited categories)
      const catAttr = await prisma.categoryAttribute.upsert({
        where: {
          categoryId_attributeId: {
            categoryId,
            attributeId: params.id,
          },
        },
        update: {
          isVisible,
        },
        create: {
          categoryId,
          attributeId: params.id,
          isVisible,
          displayOrder: 0,
          isRequired: false,
        },
      })

      // If turning ON and attribute was globally inactive, activate it
      if (isVisible) {
        await prisma.attribute.update({
          where: { id: params.id },
          data: { isActive: true },
        })
      }

      return NextResponse.json({ data: catAttr, isVisible, categoryId })
    }

    // Global update across all categories
    const attribute = await prisma.attribute.update({
      where: { id: params.id },
      data: {
        isActive: isVisible,
      },
    })

    // Also sync CategoryAttribute isVisible flag
    await prisma.categoryAttribute.updateMany({
      where: { attributeId: params.id },
      data: {
        isVisible: isVisible,
      },
    })

    return NextResponse.json({ data: attribute, isVisible })
  } catch (error) {
    console.error('Error updating attribute visibility:', error)
    return NextResponse.json(
      { error: 'Failed to update visibility' },
      { status: 500 }
    )
  }
}
