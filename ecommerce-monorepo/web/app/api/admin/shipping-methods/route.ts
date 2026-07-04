import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const methods = await prisma.shippingMethod.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ data: methods })
  } catch (error) {
    console.error('Error fetching shipping methods:', error)
    return NextResponse.json({ error: 'Failed to fetch shipping methods' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, description, defaultStatuses, customStatusesAllowed } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const method = await prisma.shippingMethod.create({
      data: {
        name,
        slug,
        description,
        defaultStatuses: defaultStatuses || [],
        customStatusesAllowed: customStatusesAllowed ?? true,
      },
    })

    return NextResponse.json({ data: method }, { status: 201 })
  } catch (error) {
    console.error('Error creating shipping method:', error)
    return NextResponse.json({ error: 'Failed to create shipping method' }, { status: 500 })
  }
}
