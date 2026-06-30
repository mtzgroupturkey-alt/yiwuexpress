import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/categories - Get all categories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'
    const includeChildren = searchParams.get('includeChildren') === 'true'
    const featured = searchParams.get('featured') === 'true'
    const parent = searchParams.get('parent')
    const level = searchParams.get('level') ? parseInt(searchParams.get('level')!) : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const where: any = {}
    if (activeOnly) {
      where.isActive = true
    }
    if (featured) {
      where.isFeatured = true
    }
    // Filter by parent categories (parent=null means top-level categories)
    if (parent === 'null' || parent === 'none') {
      where.parentId = null
    }
    // Filter by level (1 = top level, no parent)
    if (level === 1) {
      where.parentId = null
    } else if (level) {
      where.level = level
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: includeChildren ? {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              include: {
                children: {
                  where: { isActive: true }
                }
              }
            }
          }
        } : false
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ],
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category (Admin only)
export async function POST(request: Request) {
  try {
    // TODO: Add authentication check for admin
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
        { success: false, error: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: body
    })

    return NextResponse.json({
      success: true,
      data: category
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
