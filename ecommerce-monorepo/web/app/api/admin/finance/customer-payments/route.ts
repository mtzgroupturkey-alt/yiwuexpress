export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { logActivity } from '@/lib/audit'
import { z } from 'zod'

const customerPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  paymentMethod: z.string().min(1),
  paymentDate: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

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

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = customerPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Validation failed' }, { status: 400 })
    }

    const { orderId, amount, currency, paymentMethod, paymentDate, reference, notes } = parsed.data

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customerPayments: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const payment = await prisma.customerPayment.create({
      data: {
        orderId,
        amount,
        currency,
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        reference,
        notes,
      },
    })

    const totalPaid = order.customerPayments.reduce((acc, p) => acc + p.amount, 0) + amount
    const isFullyPaid = totalPaid >= order.total
    const newPaymentStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID'

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: newPaymentStatus,
        paidAt: isFullyPaid ? new Date() : order.paidAt,
      },
    })

    // Record journal entry for AR collection
    await prisma.journalEntry.create({
      data: {
        entryNumber: 'JE-AR-' + Date.now(),
        type: 'CREDIT',
        category: 'ASSET',
        account: 'Accounts Receivable',
        amount,
        currency,
        description: 'Customer payment received for Order ' + order.orderNumber,
        reference: orderId,
        createdById: admin.id,
      },
    })

    await logActivity({
      userId: admin.id,
      action: 'PAYMENT_RECEIVED',
      resource: 'CustomerPayment',
      resourceId: payment.id,
      changes: { orderId, amount, paymentStatus: newPaymentStatus, reference },
    })

    return NextResponse.json({ success: true, data: payment })
  } catch (error: any) {
    console.error('Error creating customer payment:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
