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

    const quote = await prisma.quote.findUnique({
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

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(quote)
  } catch (error: any) {
    console.error('Get quote error:', error)
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
    const { status, price, validUntil, description } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (price !== undefined) updateData.price = parseFloat(price)
    if (validUntil) updateData.validUntil = new Date(validUntil)
    if (description !== undefined) updateData.description = description

    const quote = await prisma.quote.update({
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

    return NextResponse.json(quote)
  } catch (error: any) {
    console.error('Update quote error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Quote not found' },
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

    await prisma.quote.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Quote deleted successfully' })
  } catch (error: any) {
    console.error('Delete quote error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}