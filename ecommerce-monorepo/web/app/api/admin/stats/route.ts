import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: Request) {
  try {
    // TODO: Add authentication check for admin

    // Get total counts
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalServices,
      totalQuotes,
      totalShipments,
      totalWholesaleInquiries
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.service.count(),
      prisma.quote.count(),
      prisma.shipment.count(),
      prisma.wholesaleInquiry.count()
    ])

    // Get order statistics
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    })

    // Get revenue (only completed orders)
    const revenueData = await prisma.order.aggregate({
      where: {
        status: { in: ['DELIVERED', 'COMPLETED'] },
        paymentStatus: 'PAID'
      },
      _sum: {
        total: true
      }
    })

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
    })

    // Get pending quotes
    const pendingQuotes = await prisma.quote.count({
      where: {
        status: 'PENDING'
      }
    })

    // Get active shipments
    const activeShipments = await prisma.shipment.count({
      where: {
        status: { in: ['PREPARING', 'IN_TRANSIT', 'IN_CUSTOMS'] }
      }
    })

    // Get wholesale inquiries by status
    const wholesaleByStatus = await prisma.wholesaleInquiry.groupBy({
      by: ['status'],
      _count: true
    })

    // Get low stock products (products where stock is less than or equal to their lowStockThreshold)
    const allProducts = await prisma.product.findMany({
      select: {
        stock: true,
        lowStockThreshold: true
      }
    })
    const lowStockProducts = allProducts.filter(p => p.stock <= p.lowStockThreshold).length

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOrders,
          totalProducts,
          totalServices,
          totalQuotes,
          totalShipments,
          totalWholesaleInquiries,
          revenue: revenueData._sum.total || 0,
          pendingQuotes,
          activeShipments,
          lowStockProducts
        },
        ordersByStatus: ordersByStatus.map(item => ({
          status: item.status,
          count: item._count
        })),
        wholesaleByStatus: wholesaleByStatus.map(item => ({
          status: item.status,
          count: item._count
        })),
        recentOrders
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
