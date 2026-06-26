import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { isVisible } = body

    // Update attribute visibility
    const attribute = await prisma.attribute.update({
      where: { id: params.id },
      data: {
        isActive: isVisible,
      },
    })

    return NextResponse.json({ data: attribute })
  } catch (error) {
    console.error('Error updating attribute visibility:', error)
    return NextResponse.json(
      { error: 'Failed to update visibility' },
      { status: 500 }
    )
  }
}
