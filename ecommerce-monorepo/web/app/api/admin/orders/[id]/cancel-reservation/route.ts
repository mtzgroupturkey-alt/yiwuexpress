export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const whId = order.warehouseId;
    if (!whId) {
      return NextResponse.json({ error: 'Order has no assigned warehouse reservation' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const stock = await tx.warehouseStock.findFirst({
          where: { warehouseId: whId, productId: item.productId },
        });

        if (stock && stock.reservedQty > 0) {
          await tx.warehouseStock.update({
            where: { id: stock.id },
            data: {
              reservedQty: {
                decrement: Math.min(stock.reservedQty, item.quantity),
              },
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: whId,
            type: 'ORDER_CANCELLED_RESTOCK',
            quantity: item.quantity,
            reference: order.orderNumber,
            orderId: order.id,
            notes: `Reservation cancelled/expired for order ${order.orderNumber}. Restocked to available pool.`,
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: { reservationExpiresAt: null },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Order reservation released back to available stock',
    });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
