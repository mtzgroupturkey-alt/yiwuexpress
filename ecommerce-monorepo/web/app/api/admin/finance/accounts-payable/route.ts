export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

async function checkAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload?.userId) return null
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  })
  return user?.role === 'ADMIN' ? user : null
}

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')

    const where: any = {
      isPaid: false,
      status: { notIn: ['CANCELLED', 'DRAFT'] },
    }
    if (supplierId) where.supplierId = supplierId

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
            paymentTerms: true,
            currency: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
          },
        },
      },
      orderBy: { orderDate: 'asc' },
    })

    const now = new Date().getTime()
    let totalAp = 0
    let aging0to30 = 0
    let aging31to60 = 0
    let aging61to90 = 0
    let aging90Plus = 0

    const items = purchaseOrders.map((po) => {
      const paidAmount = po.payments.reduce((acc, p) => acc + (p.amount || 0), 0)
      const balanceDue = Math.max(0, po.total - paidAmount)

      // Convert to base USD for aggregated aging metrics
      let balanceInUsd = balanceDue
      if (po.currency && po.currency !== 'USD' && po.exchangeRate && po.exchangeRate > 0) {
        balanceInUsd = balanceDue / po.exchangeRate
      }

      totalAp += balanceInUsd

      const orderAgeDays = Math.floor((now - new Date(po.orderDate).getTime()) / (1000 * 60 * 60 * 24))

      if (orderAgeDays <= 30) {
        aging0to30 += balanceInUsd
      } else if (orderAgeDays <= 60) {
        aging31to60 += balanceInUsd
      } else if (orderAgeDays <= 90) {
        aging61to90 += balanceInUsd
      } else {
        aging90Plus += balanceInUsd
      }

      return {
        id: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplier?.companyName || po.supplier?.name || 'Unknown Supplier',
        paymentTerms: po.supplier?.paymentTerms || 'net30',
        total: po.total,
        paidAmount,
        balanceDue,
        currency: po.currency,
        orderDate: po.orderDate,
        expectedDelivery: po.expectedDelivery,
        status: po.status,
        ageDays: orderAgeDays,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAp,
          aging0to30,
          aging31to60,
          aging61to90,
          aging90Plus,
          count: items.length,
        },
        items,
      },
    })
  } catch (error: any) {
    console.error('Error fetching accounts payable:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
