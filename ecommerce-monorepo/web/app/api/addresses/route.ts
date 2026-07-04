import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET: Fetch user's addresses
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ data: addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

// POST: Create new address
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      fullName,
      phone,
      addressLine,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
      label,
      company,
    } = body

    // Support both addressLine and addressLine1 for backwards compatibility
    const line1 = addressLine1 || addressLine

    // Validate required fields
    if (!fullName || !phone || !line1 || !city || !postalCode || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label: label || null,
        fullName,
        phone,
        company: company || null,
        addressLine1: line1,
        addressLine2: addressLine2 || null,
        city,
        state: state || null,
        postalCode,
        country,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ data: address }, { status: 201 })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 })
  }
}

// DELETE: Delete address
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 })
    }

    // Verify the address belongs to the user
    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    await prisma.address.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}

// PUT: Update address
export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      id,
      fullName,
      phone,
      addressLine,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
      label,
      company,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 })
    }

    // Support both addressLine and addressLine1 for backwards compatibility
    const line1 = addressLine1 || addressLine

    // Verify the address belongs to the user
    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          NOT: { id },
        },
        data: {
          isDefault: false,
        },
      })
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        label: label || null,
        fullName,
        phone,
        company: company || null,
        addressLine1: line1,
        addressLine2: addressLine2 || null,
        city,
        state: state || null,
        postalCode,
        country,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ data: updatedAddress })
  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
  }
}
