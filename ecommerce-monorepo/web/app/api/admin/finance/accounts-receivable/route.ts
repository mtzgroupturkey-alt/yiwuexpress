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
    const customerId = searchParams.get('customerId')

    const where: any = {
      paymentStatus: { in: ['UNPAID', 'PENDING', 'PARTIALLY_PAID'] },
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
    }
    if (customerId) where.userId = customerId

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            phone: true,
          },
        },
        customerPayments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const now = new Date().getTime()
    let totalAr = 0
    let aging0to30 = 0
    let aging31to60 = 0
    let aging61to90 = 0
    let aging90Plus = 0

    const items = orders.map((ord) => {
      const paidAmount = ord.customerPayments.reduce((acc, p) => acc + (p.amount || 0), 0)
      const balanceDue = Math.max(0, ord.total - paidAmount)
      totalAr += balanceDue

      const orderAgeDays = Math.floor((now - new Date(ord.createdAt).getTime()) / (1000 * 60 * 60 * 24))

      if (orderAgeDays <= 30) {
        aging0to30 += balanceDue
      } else if (orderAgeDays <= 60) {
        aging31to60 += balanceDue
      } else if (orderAgeDays <= 90) {
        aging61to90 += balanceDue
      } else {
        aging90Plus += balanceDue
      }

      return {
        id: ord.id,
        orderNumber: ord.orderNumber,
        customerId: ord.userId,
        customerName: ord.customerName || ord.user?.name || 'Customer',
        customerEmail: ord.customerEmail || ord.user?.email || '',
        companyName: ord.companyName || ord.user?.companyName || null,
        total: ord.total,
        paidAmount,
        balanceDue,
        currency: ord.currency,
        orderDate: ord.createdAt,
        status: ord.status,
        paymentStatus: ord.paymentStatus,
        ageDays: orderAgeDays,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAr,
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
    console.error('Error fetching accounts receivable:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
