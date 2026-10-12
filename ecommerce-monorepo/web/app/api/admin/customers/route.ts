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
    const status = searchParams.get('status') || 'active'
    const customerType = (searchParams.get('type') || 'all').toLowerCase()

    const where: any = {
      role: 'USER',
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
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
        isActive: true,
        userType: true,
        verificationStatus: true,
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

      const isB2B = Boolean(
        u.userType === 'WHOLESALE' ||
        u.userType === 'BOTH'
      )

      let customerSegment: 'VIP' | 'B2B' | 'B2C' | 'NEW' | 'AT_RISK' | 'REGULAR' = isB2B ? 'B2B' : 'REGULAR'
      if (ltv > 10000 || orderCount >= 10) {
        customerSegment = 'VIP'
      } else if (isB2B) {
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
        isActive: u.isActive,
        joinedAt: u.createdAt,
        userType: u.userType,
        isB2B,
        verificationStatus: u.verificationStatus,
        orderCount,
        ltv,
        lastOrderDate: lastOrder,
        daysSinceLastOrder,
        segment: customerSegment,
      }
    })

    // Filter by type (b2b vs b2c) if specified
    let typeFiltered = enriched
    if (customerType === 'b2b') {
      typeFiltered = enriched.filter((c) => c.isB2B)
    } else if (customerType === 'b2c') {
      typeFiltered = enriched.filter((c) => !c.isB2B)
    }

    // Filter by segment if specified
    const filtered = segment !== 'ALL'
      ? typeFiltered.filter((c) => {
          if (segment === 'B2B') return c.isB2B
          if (segment === 'B2C') return !c.isB2B
          return c.segment === segment
        })
      : typeFiltered

    const total = filtered.length
    const paginated = filtered.slice((page - 1) * limit, page * limit)

    // Calculate active / inactive breakdown respecting the selected customerType (all / b2b / b2c)
    const baseTypeFilter: any =
      customerType === 'b2b'
        ? { userType: { in: ['WHOLESALE', 'BOTH'] } }
        : customerType === 'b2c'
        ? { userType: { notIn: ['WHOLESALE', 'BOTH'] } }
        : {}

    const [activeCount, inactiveCount, allB2bCount, allB2cCount] = await Promise.all([
      prisma.user.count({ where: { role: 'USER', isActive: true, ...baseTypeFilter } }),
      prisma.user.count({ where: { role: 'USER', isActive: false, ...baseTypeFilter } }),
      prisma.user.count({ where: { role: 'USER', userType: { in: ['WHOLESALE', 'BOTH'] } } }),
      prisma.user.count({ where: { role: 'USER', userType: { notIn: ['WHOLESALE', 'BOTH'] } } }),
    ])

    const totalLtv = typeFiltered.reduce((acc, c) => acc + c.ltv, 0)
    const vipCount = typeFiltered.filter((c) => c.segment === 'VIP').length
    const b2bCount = allB2bCount
    const b2cCount = allB2cCount
    const atRiskCount = typeFiltered.filter((c) => c.segment === 'AT_RISK').length

    return NextResponse.json({
      success: true,
      data: {
        customers: paginated,
        summary: {
          totalCustomers: activeCount + inactiveCount,
          activeCount,
          inactiveCount,
          totalLtv,
          avgLtv: total > 0 ? totalLtv / total : 0,
          vipCount,
          b2bCount,
          b2cCount,
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

export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let customerId = searchParams.get('id')

    if (!customerId) {
      try {
        const body = await request.json()
        customerId = body.id || body.customerId
      } catch {
        // body could be empty
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Protection: Admin cannot delete their own account
    if (admin.id === customerId) {
      return NextResponse.json(
        { error: 'Cannot remove your own account' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        supplierProfile: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Protection: Only manage customers, not ADMIN accounts
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin accounts cannot be removed from customer management' },
        { status: 403 }
      )
    }

    // Soft delete (deactivate) if customer has orders to preserve financial & audit history
    if (user._count.orders > 0) {
      await prisma.user.update({
        where: { id: customerId },
        data: { isActive: false },
      })

      return NextResponse.json({
        success: true,
        message: 'Customer deactivated (order and financial history preserved)',
        action: 'deactivated',
      })
    }

    // Hard delete if customer has no orders
    await prisma.$transaction(async (tx) => {
      // 1. Delete supplier profile if exists
      if (user.supplierProfile) {
        await tx.supplierProfile.delete({
          where: { id: user.supplierProfile.id },
        })
      }

      // 2. Clean up non-cascading foreign keys
      await tx.emailLog.deleteMany({ where: { userId: customerId } })
      await tx.activityLog.deleteMany({ where: { userId: customerId } })
      await tx.wholesaleInquiry.deleteMany({ where: { userId: customerId } })
      await tx.purchaseOrder.updateMany({
        where: { targetCustomerId: customerId },
        data: { targetCustomerId: null },
      })
      await tx.return.deleteMany({ where: { userId: customerId } })

      // 3. Delete user (cascades to addresses, cart, quotes, reviews, etc.)
      await tx.user.delete({
        where: { id: customerId },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Customer permanently deleted',
      action: 'deleted',
    })
  } catch (error: any) {
    console.error('DELETE /api/admin/customers error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove customer' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin accounts cannot be modified here' },
        { status: 403 }
      )
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: isActive ? 'Customer account reactivated successfully' : 'Customer account deactivated',
      data: updated,
    })
  } catch (error: any) {
    console.error('PATCH /api/admin/customers error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update customer status' },
      { status: 500 }
    )
  }
}

