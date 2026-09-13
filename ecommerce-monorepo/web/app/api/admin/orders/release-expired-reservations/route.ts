export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// POST /api/admin/orders/release-expired-reservations
// Releases order stock holds where status is PENDING / UNPAID and reservationExpiresAt < NOW
export async function POST(request: NextRequest) {
  try {
    // Allows cron or admin execution
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isCron) {
      await requireRole(request, ['ADMIN']);
    }

    const now = new Date();

    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: { not: 'PAID' },
        reservationExpiresAt: { lte: now },
        warehouseId: { not: null },
      },
      include: {
        items: true,
      },
    });

    let releasedOrdersCount = 0;
    let releasedStockUnits = 0;

    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          if (!order.warehouseId) continue;

          // Find warehouse stock
          const stock = await tx.warehouseStock.findFirst({
            where: { warehouseId: order.warehouseId, productId: item.productId },
          });

          if (stock && stock.reservedQty > 0) {
            const qtyToRelease = Math.min(stock.reservedQty, item.quantity);
            await tx.warehouseStock.update({
              where: { id: stock.id },
              data: {
                reservedQty: { decrement: qtyToRelease },
              },
            });
            releasedStockUnits += qtyToRelease;

            // Log stock movement ledger: RESERVATION_EXPIRED
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                warehouseId: order.warehouseId,
                type: 'RESERVATION_EXPIRED',
                quantity: qtyToRelease,
                reference: order.orderNumber,
                orderId: order.id,
                notes: `Released ${qtyToRelease} reserved units due to 24h expiration for order ${order.orderNumber}`,
              },
            });
          }
        }

        // Clear reservationExpiresAt and update notes or status
        await tx.order.update({
          where: { id: order.id },
          data: {
            reservationExpiresAt: null,
            adminNotes: (order.adminNotes ? order.adminNotes + '\n' : '') +
              `[Auto-Release ${now.toISOString()}] Stock reservation expired and released back to available balance.`,
          },
        });
      });

      releasedOrdersCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Released expired reservations for ${releasedOrdersCount} order(s) (${releasedStockUnits} units returned to inventory).`,
      releasedOrdersCount,
      releasedStockUnits,
    });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
