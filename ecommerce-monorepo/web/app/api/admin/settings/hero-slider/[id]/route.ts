import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'

// PUT - Update a hero slide
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
    const { id, ...data } = body

    const slide = await prisma.heroSlide.update({
      where: { id: params.id },
      data: {
        ...data,
        subtitle: data.subtitle || null,
        description: data.description || null,
        mobileImageUrl: data.mobileImageUrl || null,
        productImageUrl: data.productImageUrl || null,
        badgeText: data.badgeText || null,
        badgeColor: data.badgeColor || null,
        secondaryCtaText: data.secondaryCtaText || null,
        secondaryCtaLink: data.secondaryCtaLink || null,
        overlayColor: data.overlayColor || null,
        textColor: data.textColor || null,
      },
    })

    return NextResponse.json({ data: slide })
  } catch (error) {
    console.error('Failed to update hero slide:', error)
    return NextResponse.json({ error: 'Failed to update slide' }, { status: 500 })
  }
}

// DELETE - Delete a hero slide
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    await prisma.heroSlide.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete hero slide:', error)
    return NextResponse.json({ error: 'Failed to delete slide' }, { status: 500 })
  }
}
