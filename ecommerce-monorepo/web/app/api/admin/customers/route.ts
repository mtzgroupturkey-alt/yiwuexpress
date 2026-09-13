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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const segment = searchParams.get('segment') || 'ALL'

    const where: any = {
      role: 'USER',
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        businessType: true,
        taxId: true,
        country: true,
        phone: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            paymentStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Compute Customer Metrics: LTV, Order Count, Last Order Date, Segmentation
    const now = new Date().getTime()
    const enriched = users.map((u) => {
      const orders = u.orders || []
      const orderCount = orders.length
      const ltv = orders.reduce((acc, o) => acc + (o.paymentStatus === 'PAID' ? o.total : 0), 0)
      const lastOrder = orders[0]?.createdAt || null
      const daysSinceLastOrder = lastOrder
        ? Math.floor((now - new Date(lastOrder).getTime()) / (1000 * 60 * 60 * 24))
        : null

      let customerSegment: 'VIP' | 'B2B' | 'NEW' | 'AT_RISK' | 'REGULAR' = 'REGULAR'
      if (ltv > 10000 || orderCount >= 10) {
        customerSegment = 'VIP'
      } else if (u.companyName || u.businessType || u.taxId) {
        customerSegment = 'B2B'
      } else if (daysSinceLastOrder !== null && daysSinceLastOrder > 90) {
        customerSegment = 'AT_RISK'
      } else if (orderCount <= 1) {
        customerSegment = 'NEW'
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        companyName: u.companyName,
        businessType: u.businessType,
        country: u.country,
        phone: u.phone,
        joinedAt: u.createdAt,
        orderCount,
        ltv,
        lastOrderDate: lastOrder,
        daysSinceLastOrder,
        segment: customerSegment,
      }
    })

    // Filter by segment if specified
    const filtered = segment !== 'ALL'
      ? enriched.filter((c) => c.segment === segment)
      : enriched

    const total = filtered.length
    const paginated = filtered.slice((page - 1) * limit, page * limit)

    // Summary KPIs
    const totalLtv = enriched.reduce((acc, c) => acc + c.ltv, 0)
    const vipCount = enriched.filter((c) => c.segment === 'VIP').length
    const b2bCount = enriched.filter((c) => c.segment === 'B2B').length
    const atRiskCount = enriched.filter((c) => c.segment === 'AT_RISK').length

    return NextResponse.json({
      success: true,
      data: {
        customers: paginated,
        summary: {
          totalCustomers: enriched.length,
          totalLtv,
          avgLtv: enriched.length > 0 ? totalLtv / enriched.length : 0,
          vipCount,
          b2bCount,
          atRiskCount,
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error: any) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
