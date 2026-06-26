import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'

// GET - List all hero slides
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const slides = await prisma.heroSlide.findMany({
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json({ data: slides })
  } catch (error) {
    console.error('Failed to fetch hero slides:', error)
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 })
  }
}

// POST - Create a new hero slide
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      subtitle,
      description,
      imageUrl,
      mobileImageUrl,
      productImageUrl,
      badgeText,
      badgeColor,
      ctaText,
      ctaLink,
      secondaryCtaText,
      secondaryCtaLink,
      overlayColor,
      textColor,
      slideDuration,
      isActive,
    } = body

    if (!title || !imageUrl || !ctaText || !ctaLink) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current max display order
    const maxOrder = await prisma.heroSlide.aggregate({
      _max: { displayOrder: true },
    })

    const slide = await prisma.heroSlide.create({
      data: {
        title,
        subtitle: subtitle || null,
        description: description || null,
        imageUrl,
        mobileImageUrl: mobileImageUrl || null,
        productImageUrl: productImageUrl || null,
        badgeText: badgeText || null,
        badgeColor: badgeColor || null,
        ctaText,
        ctaLink,
        secondaryCtaText: secondaryCtaText || null,
        secondaryCtaLink: secondaryCtaLink || null,
        overlayColor: overlayColor || null,
        textColor: textColor || null,
        slideDuration: slideDuration || 5,
        isActive: isActive !== false,
        displayOrder: (maxOrder._max.displayOrder || -1) + 1,
      },
    })

    return NextResponse.json({ data: slide }, { status: 201 })
  } catch (error) {
    console.error('Failed to create hero slide:', error)
    return NextResponse.json({ error: 'Failed to create slide' }, { status: 500 })
  }
}
