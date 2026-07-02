import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attribute = await prisma.attribute.findUnique({
      where: { id: params.id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            values: true,
          },
        },
      },
    })

    if (!attribute) {
      return NextResponse.json(
        { error: 'Attribute not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: attribute })
  } catch (error) {
    console.error('Error fetching attribute:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attribute' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const {
      name,
      slug,
      type,
      options,
      colorOptions,
      placeholder,
      helperText,
      isRequired,
      isFilterable,
      isVariant,
      categoryId,
    } = body

    // Check if attribute exists
    const existingAttribute = await prisma.attribute.findUnique({
      where: { id: params.id },
    })

    if (!existingAttribute) {
      return NextResponse.json(
        { error: 'Attribute not found' },
        { status: 404 }
      )
    }

    // If slug is being changed, check if new slug is available
    if (slug && slug !== existingAttribute.slug) {
      const slugExists = await prisma.attribute.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'An attribute with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Update attribute
    const attribute = await prisma.attribute.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        type,
        options: options || [],
        colorOptions: colorOptions ?? null,
        placeholder,
        helperText,
        isRequired,
        isFilterable,
        isVariant,
      },
    })

    // Update category association if provided
    if (categoryId) {
      // Check if association exists
      const existingAssociation = await prisma.categoryAttribute.findFirst({
        where: {
          attributeId: params.id,
          categoryId,
        },
      })

      if (!existingAssociation) {
        await prisma.categoryAttribute.create({
          data: {
            categoryId,
            attributeId: params.id,
          },
        })
      }
    }

    return NextResponse.json({ data: attribute })
  } catch (error) {
    console.error('Error updating attribute:', error)
    return NextResponse.json(
      { error: 'Failed to update attribute' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if attribute exists
    const attribute = await prisma.attribute.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            values: true,
          },
        },
      },
    })

    if (!attribute) {
      return NextResponse.json(
        { error: 'Attribute not found' },
        { status: 404 }
      )
    }

    // Check if attribute is in use
    if (attribute._count.values > 0) {
      return NextResponse.json(
        { error: 'Cannot delete attribute that is being used by products' },
        { status: 400 }
      )
    }

    // Delete attribute (cascade will delete category associations)
    await prisma.attribute.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Attribute deleted successfully' })
  } catch (error) {
    console.error('Error deleting attribute:', error)
    return NextResponse.json(
      { error: 'Failed to delete attribute' },
      { status: 500 }
    )
  }
}
