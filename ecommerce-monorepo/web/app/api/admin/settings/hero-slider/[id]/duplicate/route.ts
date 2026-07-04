import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken, getTokenFromRequest } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get the original slide
    const original = await prisma.heroSlide.findUnique({
      where: { id },
    })

    if (!original) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
    }

    // Get the highest display order
    const maxOrder = await prisma.heroSlide.aggregate({
      _max: { displayOrder: true },
    })

    // Create a copy
    const duplicated = await prisma.heroSlide.create({
      data: {
        title: `${original.title} (Copy)`,
        subtitle: original.subtitle,
        description: original.description,
        imageUrl: original.imageUrl,
        mobileImageUrl: original.mobileImageUrl,
        productImageUrl: original.productImageUrl,
        badgeText: original.badgeText,
        badgeColor: original.badgeColor,
        ctaText: original.ctaText,
        ctaLink: original.ctaLink,
        secondaryCtaText: original.secondaryCtaText,
        secondaryCtaLink: original.secondaryCtaLink,
        overlayColor: original.overlayColor,
        textColor: original.textColor,
        slideDuration: original.slideDuration,
        motionType: original.motionType,
        // Set inactive by default
        isActive: false,
        // Place at the end
        displayOrder: (maxOrder._max.displayOrder || -1) + 1,
      },
    })

    return NextResponse.json({ data: duplicated }, { status: 201 })
  } catch (error) {
    console.error('Error duplicating slide:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate slide' },
      { status: 500 }
    )
  }
}
