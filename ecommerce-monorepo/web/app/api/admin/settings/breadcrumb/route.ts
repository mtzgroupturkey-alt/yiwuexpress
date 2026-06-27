import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET - List all breadcrumb settings
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.breadcrumbSetting.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { pageType: 'asc' },
        { pageSlug: 'asc' },
      ],
    })

    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Error fetching breadcrumb settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new breadcrumb setting
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { pageType, pageSlug, categoryId, imageUrl, mobileImageUrl, overlayColor, title, subtitle, isActive } = body

    // Validation
    if (!pageType || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for duplicates
    const where: any = { pageType }
    if (pageType === 'static' && pageSlug) where.pageSlug = pageSlug
    if (pageType === 'category' && categoryId) where.categoryId = categoryId

    const existing = await prisma.breadcrumbSetting.findFirst({ where })
    if (existing) {
      return NextResponse.json({ error: 'A setting for this page already exists' }, { status: 409 })
    }

    const setting = await prisma.breadcrumbSetting.create({
      data: {
        pageType,
        pageSlug: pageType === 'static' ? pageSlug : null,
        categoryId: pageType === 'category' ? categoryId : null,
        imageUrl,
        mobileImageUrl: mobileImageUrl || null,
        overlayColor: overlayColor || null,
        title: title || null,
        subtitle: subtitle || null,
        isActive: isActive !== false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ data: setting }, { status: 201 })
  } catch (error) {
    console.error('Error creating breadcrumb setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
