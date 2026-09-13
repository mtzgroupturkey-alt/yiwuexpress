export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/finance/summary - Aggregated financial metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '30d'

    // Compute date boundary if filtered
    const now = new Date()
    let startDate: Date | undefined
    if (timeRange === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (timeRange === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (timeRange === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    } else if (timeRange === '1y') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    }

    const orderWhere = startDate ? { createdAt: { gte: startDate } } : {}

    // 1. Fetch Orders for revenue & profit computation
    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        shippingFee: true,
        tax: true,
        total: true,
        profit: true,
        purchaseCost: true,
        currency: true,
        createdAt: true,
        customerName: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 2. Compute Order financial aggregates
    let grossGmv = 0
    let paidRevenue = 0
    let pendingAr = 0
    let totalCogs = 0
    let totalShippingFee = 0
    let totalTax = 0
    let totalGrossProfit = 0

    orders.forEach((ord) => {
      const tot = Number(ord.total) || 0
      grossGmv += tot

      if (ord.paymentStatus === 'PAID') {
        paidRevenue += tot
      } else if (ord.paymentStatus === 'PENDING' || ord.paymentStatus === 'UNPAID') {
        pendingAr += tot
      }

      const cogs = Number(ord.purchaseCost) || 0
      totalCogs += cogs

      const ship = Number(ord.shippingFee) || 0
      totalShippingFee += ship

      const tax = Number(ord.tax) || 0
      totalTax += tax

      // If profit is pre-recorded, use it; otherwise compute revenue - cogs
      const prof = ord.profit !== null && ord.profit !== undefined ? Number(ord.profit) : (tot - cogs)
      totalGrossProfit += prof
    })

    const grossMarginRate = grossGmv > 0 ? (totalGrossProfit / grossGmv) * 100 : 0

    // 3. Fetch Purchase Orders (Supplier Accounts Payable)
    let totalAp = 0
    let pendingAp = 0
    let paidAp = 0

    try {
      const pos = await prisma.purchaseOrder.findMany({
        where: orderWhere,
        select: {
          id: true,
          poNumber: true,
          status: true,
          total: true,
          currency: true,
          exchangeRate: true,
          createdAt: true,
        },
      })

      pos.forEach((po) => {
        // Convert to base USD currency:
        // 1. Use costInBase if present
        // 2. Otherwise if currency is not USD and exchangeRate > 0, divide total by exchangeRate
        // 3. Otherwise use raw total
        let amt = Number(po.total) || 0
        if (po.currency && po.currency !== 'USD') {
          if (po.exchangeRate && po.exchangeRate > 0) {
            amt = amt / po.exchangeRate
          }
        }

        totalAp += amt
        if (po.status === 'RECEIVED' || po.status === 'CLOSED') {
          paidAp += amt
        } else if (po.status !== 'CANCELLED') {
          pendingAp += amt
        }
      })
    } catch (e) {
      // If purchase orders table empty or non-critical error
      console.warn('Purchase orders read warning:', e)
    }

    // 4. Monthly/daily trends breakdown (Last 6 groups)
    const monthlyLedger: Record<string, { month: string; revenue: number; cogs: number; profit: number; ordersCount: number }> = {}

    orders.forEach((ord) => {
      const d = new Date(ord.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyLedger[key]) {
        monthlyLedger[key] = { month: key, revenue: 0, cogs: 0, profit: 0, ordersCount: 0 }
      }
      monthlyLedger[key].revenue += Number(ord.total) || 0
      const cogs = Number(ord.purchaseCost) || 0
      monthlyLedger[key].cogs += cogs
      monthlyLedger[key].profit += ord.profit !== null && ord.profit !== undefined ? Number(ord.profit) : ((Number(ord.total) || 0) - cogs)
      monthlyLedger[key].ordersCount += 1
    })

    const trends = Object.values(monthlyLedger).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          grossGmv,
          paidRevenue,
          pendingAr,
          totalCogs,
          totalShippingFee,
          totalTax,
          totalGrossProfit,
          grossMarginRate: Number(grossMarginRate.toFixed(2)),
          totalAp,
          pendingAp,
          paidAp,
          totalOrdersCount: orders.length,
        },
        trends,
        recentTransactions: orders.slice(0, 15),
      },
    })
  } catch (error) {
    console.error('Error fetching finance summary:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch finance summary' },
      { status: 500 }
    )
  }
}
