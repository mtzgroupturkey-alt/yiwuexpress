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

  return null // No error
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authError = await checkAdminAuth(request)
    if (authError) return authError

    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        quotes: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          }
        },
        shipments: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Get service error:', error)
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
    const { name, slug, description, price, duration, coverage, type, image, isActive } = body

    // Check if slug is being changed and if it already exists
    if (slug) {
      const existingService = await prisma.service.findUnique({
        where: { slug }
      })

      if (existingService && existingService.id !== params.id) {
        return NextResponse.json(
          { error: 'Service with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(duration !== undefined && { duration }),
        ...(coverage !== undefined && { coverage }),
        ...(type && { type }),
        ...(image !== undefined && { image }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Update service error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Service not found' },
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

    // Check if service has associated quotes or shipments
    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        quotes: true,
        shipments: true,
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (service.quotes.length > 0 || service.shipments.length > 0) {
      // Instead of deleting, deactivate the service
      const updatedService = await prisma.service.update({
        where: { id: params.id },
        data: { isActive: false },
      })

      return NextResponse.json({
        message: 'Service deactivated due to existing quotes/shipments',
        service: updatedService
      })
    }

    // If no associations, delete the service
    await prisma.service.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}