import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/categories/[id] - Get single category
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Manually add parent and children
    const parent = category.parentId
      ? await prisma.category.findUnique({
          where: { id: category.parentId },
          select: { id: true, name: true }
        })
      : null

    const children = await prisma.category.findMany({
      where: { parentId: category.id },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        parent,
        children,
        _count: {
          products: category.products.length,
          children: children.length
        }
      }
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/categories/[id] - Update category
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    console.log('[API] PUT /api/admin/categories/' + id)
    console.log('[API] Request body:', JSON.stringify(body, null, 2))

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // If slug is being changed, check for conflicts
    if (body.slug && body.slug !== existing.slug) {
      const slugConflict = await prisma.category.findFirst({
        where: {
          slug: body.slug,
          id: { not: id }
        }
      })
      if (slugConflict) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    // Prevent circular parent references
    if (body.parentId) {
      if (body.parentId === id) {
        return NextResponse.json(
          { success: false, error: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }

      // Check if the new parent is a child of this category
      const checkCircular = async (parentId: string, originalId: string): Promise<boolean> => {
        const parent = await prisma.category.findUnique({
          where: { id: parentId },
          select: { parentId: true }
        })
        if (!parent) return false
        if (parent.parentId === originalId) return true
        if (parent.parentId) return await checkCircular(parent.parentId, originalId)
        return false
      }

      const isCircular = await checkCircular(body.parentId, id)
      if (isCircular) {
        return NextResponse.json(
          { success: false, error: 'Cannot create circular parent relationship' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      image: body.image,
      icon: body.icon,
      parentId: body.parentId || null,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      showInMenu: body.showInMenu !== undefined ? body.showInMenu : existing.showInMenu,
      isFeatured: body.isFeatured !== undefined ? body.isFeatured : existing.isFeatured,
    }

    console.log('[API] Update data being sent to database:', JSON.stringify(updateData, null, 2))

    // Update category
    const updated = await prisma.category.update({
      where: { id },
      data: updateData
    })

    console.log('[API] Updated category:', JSON.stringify(updated, null, 2))

    // Get relations
    const parent = updated.parentId
      ? await prisma.category.findUnique({
          where: { id: updated.parentId },
          select: { id: true, name: true }
        })
      : null

    const children = await prisma.category.findMany({
      where: { parentId: updated.id }
    })

    const productCount = await prisma.product.count({
      where: { categoryId: updated.id }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        parent,
        children,
        _count: {
          products: productCount,
          children: children.length
        }
      },
      message: 'Category updated successfully'
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/categories/[id] - Delete category
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id }
    })

    if (productCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete category with ${productCount} product(s). Remove products first or mark category as inactive.` 
        },
        { status: 400 }
      )
    }

    // Check if category has children
    const childrenCount = await prisma.category.count({
      where: { parentId: id }
    })

    if (childrenCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete category with ${childrenCount} subcategory(ies). Remove subcategories first.` 
        },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
