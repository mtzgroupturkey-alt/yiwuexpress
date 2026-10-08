export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { logActivity } from '@/lib/audit'
import { restoreOrderInventory } from '@/lib/inventory/order-restoration'

// PATCH /api/admin/orders/bulk - Perform bulk operations on orders
export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload?.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    })
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Admin required' }, { status: 403 })

    const body = await request.json()
    const { ids, action, status } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No order IDs provided' }, { status: 400 })
    }


    if (action === 'STATUS_UPDATE') {
      if (!status) return NextResponse.json({ error: 'Status is required' }, { status: 400 })

      const updatedCount = await prisma.$transaction(async (tx) => {
        const orders = await tx.order.findMany({
          where: { id: { in: ids } },
          include: { items: true },
        })

        for (const ord of orders) {
          if (status === 'CANCELLED' && ord.status !== 'CANCELLED') {
            await restoreOrderInventory(tx, ord.id, {
              reason: 'CANCELLED',
              notes: 'Bulk status update to CANCELLED',
            })
          }

          const updateData: any = { status }
          if (status === 'PAID') {
            updateData.paymentStatus = 'PAID'
            if (!ord.paidAt) updateData.paidAt = new Date()
          } else if (status === 'REFUNDED') {
            updateData.paymentStatus = 'REFUNDED'
          }

          await tx.order.update({
            where: { id: ord.id },
            data: updateData,
          })
        }

        return orders.length
      })

      // Log activity
      await logActivity({
        userId: admin.id,
        action: 'BULK_UPDATE',
        resource: 'ORDER',
        resourceId: `[${ids.length} orders]`,
        changes: { ids, newStatus: status, count: updatedCount },
      })

      return NextResponse.json({ success: true, count: updatedCount })
    }

    if (action === 'DELETE') {
      const result = await prisma.order.deleteMany({
        where: { id: { in: ids } },
      })

      await logActivity({
        userId: admin.id,
        action: 'BULK_DELETE',
        resource: 'ORDER',
        resourceId: `[${ids.length} orders]`,
        changes: { ids, count: result.count },
      })

      return NextResponse.json({ success: true, count: result.count })
    }

    return NextResponse.json({ error: 'Unsupported bulk action' }, { status: 400 })
  } catch (error) {
    console.error('Error in bulk orders operation:', error)
    return NextResponse.json({ error: 'Failed to process bulk orders' }, { status: 500 })
  }
}
