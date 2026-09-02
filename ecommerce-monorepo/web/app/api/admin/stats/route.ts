export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: Request) {
  try {
    // Get total counts safely in parallel
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalServices,
      totalQuotes,
      totalShipments,
      totalWholesaleInquiries,
      lowStockProducts
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.order.count().catch(() => 0),
      prisma.product.count().catch(() => 0),
      prisma.service.count().catch(() => 0),
      prisma.quote.count().catch(() => 0),
      prisma.shipment.count().catch(() => 0),
      prisma.wholesaleInquiry.count().catch(() => 0),
      prisma.product.count({ where: { stock: { lte: 10 } } }).catch(() => 0),
    ])

    // Get order statistics
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    }).catch(() => [])

    // Get revenue (only completed orders)
    const revenueData = await prisma.order.aggregate({
      where: {
        status: { in: ['DELIVERED', 'COMPLETED'] },
        paymentStatus: 'PAID'
      },
      _sum: {
        total: true
      }
    }).catch(() => ({ _sum: { total: 0 } }))

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true
      }
    }).catch(() => [])

    // Get pending quotes
    const pendingQuotes = await prisma.quote.count({
      where: {
        status: 'PENDING'
      }
    }).catch(() => 0)

    // Get active shipments
    const activeShipments = await prisma.shipment.count({
      where: {
        status: { in: ['PREPARING', 'IN_TRANSIT', 'IN_CUSTOMS'] }
      }
    }).catch(() => 0)

    // Get wholesale inquiries by status
    const wholesaleByStatus = await prisma.wholesaleInquiry.groupBy({
      by: ['status'],
      _count: true
    }).catch(() => [])

    // Get recent quotes
    const recentQuotes = await prisma.quote.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    }).catch(() => [])

    // Get recent shipments
    const recentShipments = await prisma.shipment.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        service: {
          select: {
            name: true
          }
        }
      }
    }).catch(() => [])

    const totalRevenue = revenueData?._sum?.total || 0

    return NextResponse.json({
      success: true,
      totalUsers,
      totalOrders,
      totalProducts,
      totalServices,
      totalQuotes,
      totalShipments,
      totalWholesaleInquiries,
      totalRevenue,
      thisMonthRevenue: totalRevenue,
      pendingQuotes,
      activeShipments,
      lowStockProducts,
      recentQuotes,
      recentShipments,
      recentOrders,
      data: {
        overview: {
          totalUsers,
          totalOrders,
          totalProducts,
          totalServices,
          totalQuotes,
          totalShipments,
          totalWholesaleInquiries,
          revenue: totalRevenue,
          pendingQuotes,
          activeShipments,
          lowStockProducts
        },
        ordersByStatus: ordersByStatus.map((item: any) => ({
          status: item.status,
          count: item._count
        })),
        wholesaleByStatus: wholesaleByStatus.map((item: any) => ({
          status: item.status,
          count: item._count
        })),
        recentOrders,
        recentQuotes,
        recentShipments
      }
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin statistics' },
      { status: 500 }
    )
  }
}
