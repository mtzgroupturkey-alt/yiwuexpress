export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { logActivity } from '@/lib/audit'
import { z } from 'zod'

const paymentSchema = z.object({
  purchaseOrderId: z.string().min(1),
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
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Validation failed' }, { status: 400 })
    }

    const { purchaseOrderId, amount, currency, paymentMethod, paymentDate, reference, notes } = parsed.data

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { payments: true },
    })

    if (!po) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 })
    }

    const payment = await prisma.supplierPayment.create({
      data: {
        purchaseOrderId,
        amount,
        currency,
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        reference,
        notes,
      },
    })

    // Check if PO is now fully paid
    const totalPaid = po.payments.reduce((acc, p) => acc + p.amount, 0) + amount
    const isPaid = totalPaid >= po.total

    await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        isPaid,
        paidDate: isPaid ? new Date() : po.paidDate,
      },
    })

    // Record journal entry for AP disbursement
    await prisma.journalEntry.create({
      data: {
        entryNumber: 'JE-AP-' + Date.now(),
        type: 'DEBIT',
        category: 'LIABILITY',
        account: 'Accounts Payable',
        amount,
        currency,
        description: 'Supplier payment for PO ' + po.poNumber,
        reference: purchaseOrderId,
        createdById: admin.id,
      },
    })

    await logActivity({
      userId: admin.id,
      action: 'PAYMENT_RECORDED',
      resource: 'SupplierPayment',
      resourceId: payment.id,
      changes: { purchaseOrderId, amount, isPaid, reference },
    })

    return NextResponse.json({ success: true, data: payment })
  } catch (error: any) {
    console.error('Error creating supplier payment:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
