import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken, getTokenFromRequest } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slides } = await req.json()

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const updates = slides.map((item) =>
      prisma.heroSlide.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update slide order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
