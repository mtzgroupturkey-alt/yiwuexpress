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

    const suppliers = await prisma.supplier.findMany({
      include: {
        purchaseOrders: {
          select: {
            id: true,
            poNumber: true,
            total: true,
            currency: true,
            exchangeRate: true,
            status: true,
            isPaid: true,
            orderDate: true,
            createdAt: true,
            payments: {
              select: {
                id: true,
                amount: true,
                paymentDate: true,
                paymentMethod: true,
                reference: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    let totalPurchasedAll = 0
    let totalPaidAll = 0
    let totalBalanceAll = 0

    const settlements = suppliers.map((sup) => {
      let totalPurchased = 0
      let totalPaid = 0

      const orderList = sup.purchaseOrders.map((po) => {
        const poPaid = po.payments.reduce((acc, p) => acc + (p.amount || 0), 0)
        const isCancelled = po.status === 'CANCELLED'
        if (!isCancelled) {
          totalPurchased += po.total
          totalPaid += poPaid

          // Normalize to USD for overall system-level totals
          const rate = (po.currency !== 'USD' && po.exchangeRate && po.exchangeRate > 0) ? po.exchangeRate : 1
          totalPurchasedAll += (po.total / rate)
          totalPaidAll += (poPaid / rate)
        }
        return {
          id: po.id,
          poNumber: po.poNumber,
          total: po.total,
          paid: poPaid,
          balance: Math.max(0, po.total - poPaid),
          currency: po.currency || 'USD',
          exchangeRate: po.exchangeRate || 1,
          status: po.status,
          isPaid: po.isPaid || (po.total > 0 && poPaid >= po.total),
          orderDate: po.orderDate || po.createdAt,
          payments: po.payments,
        }
      })

      // Derive effective currency for supplier (from POs or supplier default)
      const effectiveCurrency = sup.purchaseOrders.length > 0 && sup.purchaseOrders[0].currency
        ? sup.purchaseOrders[0].currency
        : (sup.currency || 'USD')

      const balance = Math.max(0, totalPurchased - totalPaid)
      totalBalanceAll = Math.max(0, totalPurchasedAll - totalPaidAll)

      const primaryName = sup.name || sup.companyName || 'Unnamed Supplier'

      return {
        id: sup.id,
        supplierId: sup.id,
        name: primaryName,
        supplierName: primaryName,
        companyName: sup.companyName || '',
        contactPerson: sup.contactPerson || '',
        email: sup.email || '',
        phone: sup.phone || '',
        address: sup.address || '',
        taxId: sup.taxId || '',
        paymentTerms: sup.paymentTerms || 'net30',
        currency: effectiveCurrency,
        totalOrders: sup.purchaseOrders.length,
        poCount: sup.purchaseOrders.length,
        totalPurchased,
        totalPaid,
        balanceDue: balance,
        balance,
        status: balance === 0 ? 'SETTLED' : 'OUTSTANDING',
        orders: orderList,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSuppliers: suppliers.length,
          totalPurchased: totalPurchasedAll,
          totalPaid: totalPaidAll,
          totalBalance: totalBalanceAll,
        },
        settlements,
      },
    })
  } catch (error: any) {
    console.error('Error fetching supplier settlement:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
