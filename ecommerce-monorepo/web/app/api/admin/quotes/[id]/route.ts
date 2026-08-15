export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(request, ['ADMIN'])

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
    return createAuthErrorResponse(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(request, ['ADMIN'])

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
    return createAuthErrorResponse(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(request, ['ADMIN'])

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
    return createAuthErrorResponse(error)
  }
}