import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/orders/:id - Get single order details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        },
        shippingCountry: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                thumbnail: true,
                sku: true,
                price: true
              }
            },
            variant: {
              select: {
                id: true,
                sku: true,
                price: true,
                stock: true
              }
            }
          }
        },
        exceptions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/orders/:id - Update order
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, trackingNumber, carrier, adminNotes } = body

    const updateData: any = {}

    if (status !== undefined) updateData.status = status
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
    if (carrier !== undefined) updateData.carrier = carrier
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes

    // Add shipping timestamp when status changes to SHIPPED
    if (status === 'SHIPPED' && !updateData.shippedAt) {
      updateData.shippedAt = new Date()
    }

    // Add delivery timestamp when status changes to DELIVERED
    if (status === 'DELIVERED' && !updateData.actualDelivery) {
      updateData.actualDelivery = new Date()
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                thumbnail: true,
                sku: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/orders/:id - Delete order
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.order.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
