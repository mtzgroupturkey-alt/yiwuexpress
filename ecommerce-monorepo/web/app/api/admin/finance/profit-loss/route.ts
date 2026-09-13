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
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const modeParam = searchParams.get('mode')

    const dateFilter: any = {}
    if (startDateParam) dateFilter.gte = new Date(startDateParam)
    if (endDateParam) dateFilter.lte = new Date(endDateParam)

    const orderWhere: any = {
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
      ...(modeParam && modeParam !== 'ALL' ? { mode: modeParam.toUpperCase() } : {}),
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    }

    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        subtotal: true,
        shippingFee: true,
        tax: true,
        purchaseCost: true,
        profit: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Compute Sales & COGS
    let totalSalesRevenue = 0
    let totalShippingRevenue = 0
    let totalTaxCollected = 0
    let totalCogs = 0

    orders.forEach((o) => {
      totalSalesRevenue += o.subtotal || 0
      totalShippingRevenue += o.shippingFee || 0
      totalTaxCollected += o.tax || 0
      totalCogs += o.purchaseCost || 0
    })

    const grossRevenue = totalSalesRevenue + totalShippingRevenue + totalTaxCollected
    const grossProfit = grossRevenue - totalCogs

    // Operating expenses from journal entries if any
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        category: 'EXPENSE',
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
    })

    const operatingExpenses = journalEntries.reduce((acc, e) => acc + (e.amount || 0), 0)
    const netProfit = grossProfit - operatingExpenses
    const netMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0

    const grossMarginPercent = Number((grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0).toFixed(1))
    const netMarginPercent = Number((grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0).toFixed(1))

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDateParam,
          endDate: endDateParam,
          orderCount: orders.length,
        },
        revenue: {
          totalSalesRevenue,
          totalShippingRevenue,
          totalTaxCollected,
          grossRevenue,
          salesRevenue: totalSalesRevenue,
          shippingRevenue: totalShippingRevenue,
          taxCollected: totalTaxCollected,
        },
        costOfGoodsSold: {
          totalCogs,
          procurementCost: totalCogs,
          grossProfit,
          grossMarginPercent,
        },
        operatingExpenses: {
          totalOperatingExpenses: operatingExpenses,
          entriesCount: journalEntries.length,
        },
        expenses: {
          operatingExpenses,
          entriesCount: journalEntries.length,
        },
        netIncome: {
          netIncome: netProfit,
          netMarginPercent,
        },
        grossProfit,
        grossMargin: grossMarginPercent,
        netProfit,
        netMargin: netMarginPercent,
        orderCount: orders.length,
      },
    })
  } catch (error: any) {
    console.error('Error computing P&L:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
