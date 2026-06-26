import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isFeatured } = await req.json()

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { isFeatured },
    })

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Error updating featured status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update featured status' },
      { status: 500 }
    )
  }
}
