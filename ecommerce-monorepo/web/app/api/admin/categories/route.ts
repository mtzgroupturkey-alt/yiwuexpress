export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/categories - List all categories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const includeAttributes = searchParams.get('includeAttributes') === 'true'

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        products: {
          select: { id: true }
        },
        translations: {
          select: {
            locale: true,
            name: true
          }
        },
        ...(includeAttributes && {
          attributes: {
            include: {
              attribute: true
            }
          }
        })
      },
      orderBy: { name: 'asc' }
    })

    // Manually add parent and children relationships
    const categoriesWithRelations = await Promise.all(
      categories.map(async (cat) => {
        const parent = cat.parentId
          ? await prisma.category.findUnique({
              where: { id: cat.parentId },
              select: { id: true, name: true }
            })
          : null

        const children = await prisma.category.findMany({
          where: { parentId: cat.id },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        })

        return {
          ...cat,
          parent,
          children,
          _count: {
            products: cat.products.length,
            children: children.length,
            ...(includeAttributes && { attributes: cat.attributes?.length || 0 })
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: categoriesWithRelations
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories - Create new category
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug: body.slug }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Slug already exists' },
        { status: 400 }
      )
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        image: body.image,
        icon: body.icon,
        parentId: body.parentId || null,
        isActive: body.isActive !== false,
        showInMenu: body.showInMenu !== false,
        isFeatured: body.isFeatured || false,
        level: body.parentId ? 2 : 1, // Calculate level
        menuOrder: body.menuOrder || 0,
      }
    })

    // Expand-and-Contract dual-write: seed translation rows from the nested
    // `translations` payload (en/ru/zh) and fall back to legacy name/description
    // for the 'en' row so un-migrated read paths keep working.
    // The admin form sends `translations` as an array of {locale, name, description};
    // normalize it to a locale-keyed object before writing.
    const translationsArray: { locale: string; name?: string; description?: string }[] =
      Array.isArray(body.translations) ? body.translations : []
    const incoming: Record<string, { name?: string; description?: string }> = {}
    for (const t of translationsArray) {
      if (t && t.locale) incoming[t.locale] = { name: t.name, description: t.description }
    }
    const localesToWrite = new Set<string>(['en'])
    Object.keys(incoming).forEach((l) => localesToWrite.add(l))
    for (const locale of localesToWrite) {
      const t = incoming[locale]
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale } },
        create: {
          categoryId: category.id,
          locale,
          name: (t?.name ?? (locale === 'en' ? body.name : '')) || '',
          description: t?.description ?? (locale === 'en' ? body.description ?? null : null)
        },
        update: {
          name: (t?.name ?? (locale === 'en' ? body.name : '')) || '',
          description: t?.description ?? (locale === 'en' ? body.description ?? null : null)
        }
      })
    }

    // Fetch with relations
    const parent = category.parentId
      ? await prisma.category.findUnique({
          where: { id: category.parentId },
          select: { id: true, name: true }
        })
      : null

    const products = await prisma.product.count({
      where: { categoryId: category.id }
    })

    const children = await prisma.category.count({
      where: { parentId: category.id }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        parent,
        children: [],
        _count: {
          products,
          children
        }
      },
      message: 'Category created successfully'
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
