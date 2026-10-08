import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN'])

    const [specMappings, categoryMappings, categories, attributes] = await Promise.all([
      prisma.ikeaSpecMapping.findMany({
        include: {
          attribute: {
            select: { id: true, name: true, slug: true, type: true }
          }
        },
        orderBy: { ikeaKey: 'asc' }
      }),
      prisma.ikeaCategoryMapping.findMany({
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          }
        },
        orderBy: { ikeaCategoryName: 'asc' }
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' }
      }),
      prisma.attribute.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, type: true },
        orderBy: { name: 'asc' }
      })
    ])

    return NextResponse.json({
      success: true,
      specMappings,
      categoryMappings,
      categories,
      attributes
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return createAuthErrorResponse(err)
    }
    return NextResponse.json(
      { error: err.message || 'Internal server error fetching IKEA mappings' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN'])

    const body = await req.json()
    const { type, action = 'create', id, ikeaKey, ikeaCategoryName, attributeId, categoryId, unit, aliases } = body

    if (type === 'spec') {
      if (action === 'delete') {
        if (!id) return NextResponse.json({ error: 'id required for delete' }, { status: 400 })
        await prisma.ikeaSpecMapping.delete({ where: { id } })
        return NextResponse.json({ success: true, message: 'Spec mapping deleted' })
      }

      if (!ikeaKey) {
        return NextResponse.json({ error: 'ikeaKey is required' }, { status: 400 })
      }

      const normalizedKey = ikeaKey.trim().toLowerCase()
      const aliasesArray = Array.isArray(aliases)
        ? aliases
        : typeof aliases === 'string'
        ? aliases.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []

      const mapping = await prisma.ikeaSpecMapping.upsert({
        where: { ikeaKey: normalizedKey },
        create: {
          ikeaKey: normalizedKey,
          attributeId: attributeId || null,
          unit: unit || null,
          aliases: aliasesArray
        },
        update: {
          attributeId: attributeId || null,
          unit: unit || null,
          aliases: aliasesArray
        },
        include: { attribute: true }
      })

      return NextResponse.json({ success: true, mapping })
    } else if (type === 'category') {
      if (action === 'delete') {
        if (!id) return NextResponse.json({ error: 'id required for delete' }, { status: 400 })
        await prisma.ikeaCategoryMapping.delete({ where: { id } })
        return NextResponse.json({ success: true, message: 'Category mapping deleted' })
      }

      if (!ikeaCategoryName || !categoryId) {
        return NextResponse.json({ error: 'ikeaCategoryName and categoryId are required' }, { status: 400 })
      }

      const mapping = await prisma.ikeaCategoryMapping.upsert({
        where: { ikeaCategoryName: ikeaCategoryName.trim() },
        create: {
          ikeaCategoryName: ikeaCategoryName.trim(),
          categoryId
        },
        update: {
          categoryId
        },
        include: { category: true }
      })

      return NextResponse.json({ success: true, mapping })
    }

    return NextResponse.json({ error: 'Invalid mapping type specified' }, { status: 400 })
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return createAuthErrorResponse(err)
    }
    console.error('[API /api/admin/ikea/mappings] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error saving IKEA mapping' },
      { status: 500 }
    )
  }
}
