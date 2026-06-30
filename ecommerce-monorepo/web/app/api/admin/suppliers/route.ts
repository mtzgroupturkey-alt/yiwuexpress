import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/suppliers - Get all suppliers
export async function GET(request: NextRequest) {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ suppliers })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

// POST /api/admin/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        contactPerson: body.contactPerson,
        taxId: body.taxId,
        paymentTerms: body.paymentTerms,
        currency: body.currency || 'USD',
        notes: body.notes,
        isActive: body.isActive ?? true,
      },
    })

    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
