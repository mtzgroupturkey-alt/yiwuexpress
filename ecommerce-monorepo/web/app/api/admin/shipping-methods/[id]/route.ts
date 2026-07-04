import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const method = await prisma.shippingMethod.findUnique({
      where: { id: params.id },
    })

    if (!method) {
      return NextResponse.json({ error: 'Shipping method not found' }, { status: 404 })
    }

    return NextResponse.json({ data: method })
  } catch (error) {
    console.error('Error fetching shipping method:', error)
    return NextResponse.json({ error: 'Failed to fetch shipping method' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { name, slug, description, defaultStatuses, customStatusesAllowed, isActive } = body

    const method = await prisma.shippingMethod.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(defaultStatuses !== undefined && { defaultStatuses }),
        ...(customStatusesAllowed !== undefined && { customStatusesAllowed }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ data: method })
  } catch (error) {
    console.error('Error updating shipping method:', error)
    return NextResponse.json({ error: 'Failed to update shipping method' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.shippingMethod.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shipping method:', error)
    return NextResponse.json({ error: 'Failed to delete shipping method' }, { status: 500 })
  }
}
