import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const attributes = await prisma.attribute.findMany({
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
      orderBy: {
        displayOrder: 'asc',
      },
    })

    return NextResponse.json({ data: attributes })
  } catch (error) {
    console.error('Error fetching attributes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attributes' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Received attribute creation request:', JSON.stringify(body, null, 2))
    
    const {
      name,
      slug,
      type,
      options,
      placeholder,
      helperText,
      isRequired,
      isFilterable,
      isVariant,
      categoryId,
    } = body

    // Validate required fields
    if (!name || !name.trim()) {
      console.error('Validation failed: missing or empty name')
      return NextResponse.json(
        { error: 'Attribute name is required' },
        { status: 400 }
      )
    }

    if (!type) {
      console.error('Validation failed: missing type')
      return NextResponse.json(
        { error: 'Attribute type is required' },
        { status: 400 }
      )
    }

    // Validate categoryId
    if (!categoryId) {
      console.error('Validation failed: categoryId is required')
      return NextResponse.json(
        { error: 'Category ID is required. Please select a category first.' },
        { status: 400 }
      )
    }

    // Verify category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!categoryExists) {
      console.error('Validation failed: category not found:', categoryId)
      return NextResponse.json(
        { error: 'Selected category does not exist' },
        { status: 400 }
      )
    }

    // Validate options for SELECT/MULTISELECT types
    if ((type === 'SELECT' || type === 'MULTISELECT') && (!options || options.length === 0)) {
      console.error('Validation failed: options required for SELECT/MULTISELECT')
      return NextResponse.json(
        { error: 'Options are required for SELECT and MULTISELECT types' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '_')

    // Check if slug already exists
    const existingAttribute = await prisma.attribute.findUnique({
      where: { slug: finalSlug },
    })

    if (existingAttribute) {
      return NextResponse.json(
        { error: 'An attribute with this slug already exists' },
        { status: 400 }
      )
    }

    // Create attribute
    const attribute = await prisma.attribute.create({
      data: {
        name,
        slug: finalSlug,
        type,
        options: options || [],
        placeholder,
        helperText,
        isRequired: isRequired || false,
        isFilterable: isFilterable !== false,
        isVariant: isVariant || false,
      },
    })

    // Link to category if provided
    if (categoryId) {
      await prisma.categoryAttribute.create({
        data: {
          categoryId,
          attributeId: attribute.id,
        },
      })
    }

    return NextResponse.json({ data: attribute }, { status: 201 })
  } catch (error) {
    console.error('Error creating attribute:', error)
    return NextResponse.json(
      { error: 'Failed to create attribute' },
      { status: 500 }
    )
  }
}
