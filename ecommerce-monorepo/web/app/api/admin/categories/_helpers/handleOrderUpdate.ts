import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function handleOrderUpdate(req: NextRequest) {
  try {
    const body = await req.json()
    const rawList = body.categories || body.items

    if (!rawList || !Array.isArray(rawList)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format: expected categories or items array' },
        { status: 400 }
      )
    }

    // Update each category in a transaction
    const updates = rawList.map((item: any, index: number) => {
      const updateData: any = {}

      if (item.menuOrder !== undefined) {
        updateData.menuOrder = Number(item.menuOrder)
      } else if (body.type === 'menu' || (!('displayOrder' in item) && ('order' in item))) {
        updateData.menuOrder = Number(item.order ?? index)
      }

      if (item.displayOrder !== undefined) {
        updateData.displayOrder = Number(item.displayOrder)
      } else if (body.type === 'display') {
        updateData.displayOrder = Number(item.order ?? index)
      }

      // If neither was explicitly specified but order is given, set menuOrder as default
      if (updateData.menuOrder === undefined && updateData.displayOrder === undefined && item.order !== undefined) {
        updateData.menuOrder = Number(item.order)
      }

      // Optional flags if provided
      if (item.showInMenu !== undefined) {
        updateData.showInMenu = Boolean(item.showInMenu)
      }
      if (item.isFeatured !== undefined) {
        updateData.isFeatured = Boolean(item.isFeatured)
      }

      // Only update parentId if explicitly provided
      if ('parentId' in item) {
        updateData.parentId = item.parentId || null
      }

      // Update level if provided
      if ('level' in item && typeof item.level === 'number') {
        updateData.level = item.level
      }

      return prisma.category.update({
        where: { id: item.id },
        data: updateData,
      })
    })

    await prisma.$transaction(updates)

    return NextResponse.json({
      success: true,
      message: 'Category order updated successfully'
    })
  } catch (error) {
    console.error('Error updating category order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category order' },
      { status: 500 }
    )
  }
}
