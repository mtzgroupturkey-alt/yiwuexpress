import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function checkAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const payload = verifyToken(token)
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  return null
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await checkAdminAuth(request)
    if (authError) return authError

    const shipment = await prisma.shipment.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            businessType: true,
            phone: true,
            country: true,
          }
        },
        service: true,
      }
    })

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(shipment)
  } catch (error) {
    console.error('Get shipment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await checkAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { status, carrier, estimatedDelivery, actualDelivery, notes } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (carrier !== undefined) updateData.carrier = carrier
    if (estimatedDelivery) updateData.estimatedDelivery = new Date(estimatedDelivery)
    if (actualDelivery) updateData.actualDelivery = new Date(actualDelivery)
    if (notes !== undefined) updateData.notes = notes

    // If status is being set to DELIVERED, automatically set actualDelivery if not provided
    if (status === 'DELIVERED' && !actualDelivery && !updateData.actualDelivery) {
      updateData.actualDelivery = new Date()
    }

    const shipment = await prisma.shipment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          }
        },
        service: true,
      }
    })

    return NextResponse.json(shipment)
  } catch (error) {
    console.error('Update shipment error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await checkAdminAuth(request)
    if (authError) return authError

    await prisma.shipment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Shipment deleted successfully' })
  } catch (error) {
    console.error('Delete shipment error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}