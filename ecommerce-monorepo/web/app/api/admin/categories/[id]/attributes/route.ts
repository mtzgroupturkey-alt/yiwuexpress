import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryAttributes = await prisma.categoryAttribute.findMany({
      where: {
        categoryId: params.id,
      },
      include: {
        attribute: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    // Map to flatten the structure
    const attributes = categoryAttributes.map((ca) => ({
      ...ca.attribute,
      categoryAttributeId: ca.id,
      displayOrder: ca.displayOrder,
      isVisible: ca.isVisible,
      isRequired: ca.isRequired,
    }))

    return NextResponse.json({ data: attributes })
  } catch (error) {
    console.error('Error fetching category attributes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category attributes' },
      { status: 500 }
    )
  }
}
