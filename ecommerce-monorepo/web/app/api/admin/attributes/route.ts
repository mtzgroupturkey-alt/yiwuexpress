export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Always seed `en` from the legacy columns so the fallback chain stays intact.
function buildAttributeTranslations(
  translations: Array<{ locale: string; name?: string; placeholder?: string | null; helperText?: string | null }> | undefined,
  legacyName: string,
  legacyPlaceholder?: string | null,
  legacyHelperText?: string | null
): Array<{ locale: string; name: string; placeholder?: string | null; helperText?: string | null }> {
  const rows: Array<{ locale: string; name: string; placeholder?: string | null; helperText?: string | null }> = []
  const seen = new Set<string>()

  if (Array.isArray(translations)) {
    for (const t of translations) {
      if (!t.locale || seen.has(t.locale)) continue
      seen.add(t.locale)
      rows.push({
        locale: t.locale,
        name: t.name ?? legacyName,
        placeholder: t.placeholder ?? legacyPlaceholder ?? null,
        helperText: t.helperText ?? legacyHelperText ?? null,
      })
    }
  }

  if (!seen.has('en')) {
    rows.push({
      locale: 'en',
      name: legacyName,
      placeholder: legacyPlaceholder ?? null,
      helperText: legacyHelperText ?? null,
    })
  }

  return rows
}

export async function GET(req: NextRequest) {
  try {
    let attributes: any[] = []
    try {
      attributes = await prisma.attribute.findMany({
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          translations: true,
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
    } catch {
      // Fallback if placeholder/helperText columns do not exist in DB yet
      attributes = await prisma.attribute.findMany({
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          translations: {
            select: {
              id: true,
              attributeId: true,
              locale: true,
              name: true,
              createdAt: true,
              updatedAt: true,
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
    }

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
      colorOptions,
      placeholder,
      helperText,
      isRequired,
      isFilterable,
      isVariant,
      categoryId,
      translations,
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
      return NextResponse.json(
        { error: 'Options are required for SELECT and MULTISELECT types' },
        { status: 400 }
      )
    }

    // Validate colorOptions for COLOR types
    if ((type === 'COLOR' || type === 'COLOR_MULTI') && (!colorOptions || colorOptions.length === 0)) {
      return NextResponse.json(
        { error: 'Color options are required for COLOR attribute types' },
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
      if (categoryId) {
        const existingLink = await prisma.categoryAttribute.findUnique({
          where: {
            categoryId_attributeId: {
              categoryId,
              attributeId: existingAttribute.id,
            },
          },
        })

        if (existingLink) {
          return NextResponse.json(
            { error: 'This attribute is already assigned to this category' },
            { status: 400 }
          )
        }

        // Link existing attribute to this category
        await prisma.categoryAttribute.create({
          data: {
            categoryId,
            attributeId: existingAttribute.id,
            isRequired: isRequired || false,
            isVisible: true,
          },
        })

        return NextResponse.json({ data: existingAttribute, linked: true }, { status: 201 })
      }

      return NextResponse.json(
        { error: 'An attribute with this slug already exists' },
        { status: 400 }
      )
    }

    // Create attribute safely
    let attribute
    try {
      attribute = await prisma.attribute.create({
        data: {
          name,
          slug: finalSlug,
          type,
          options: options || [],
          colorOptions: colorOptions || null,
          placeholder,
          helperText,
          isRequired: isRequired || false,
          isFilterable: isFilterable !== false,
          isVariant: isVariant || false,
          translations: {
            create: buildAttributeTranslations(translations, name, placeholder, helperText)
          }
        },
      })
    } catch {
      // Fallback if placeholder/helperText columns do not exist in DB yet
      attribute = await prisma.attribute.create({
        data: {
          name,
          slug: finalSlug,
          type,
          options: options || [],
          colorOptions: colorOptions || null,
          placeholder,
          helperText,
          isRequired: isRequired || false,
          isFilterable: isFilterable !== false,
          isVariant: isVariant || false,
          translations: {
            create: buildAttributeTranslations(translations, name).map((t) => ({
              locale: t.locale,
              name: t.name,
            }))
          }
        },
      })
    }

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
