import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { categories } = await req.json()

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format' },
        { status: 400 }
      )
    }

    // Update each category in a transaction
    const updates = categories.map((item: any) => {
      const updateData: any = {
        menuOrder: item.menuOrder,
      }

      // Only update parentId if explicitly provided
      if ('parentId' in item) {
        updateData.parentId = item.parentId || null
      }

      // Update level if provided
      if ('level' in item) {
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
