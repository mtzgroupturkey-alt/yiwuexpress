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
      return NextResponse.json(
        { error: 'Order has no assigned fulfillment warehouse' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const stock = await tx.warehouseStock.findFirst({
          where: { warehouseId: whId, productId: item.productId },
        });

        if (stock) {
          // Deduct from physical quantity and release reservation
          await tx.warehouseStock.update({
            where: { id: stock.id },
            data: {
              quantity: { decrement: item.quantity },
              reservedQty: {
                decrement: Math.min(stock.reservedQty, item.quantity),
              },
            },
          });
        }

        // Deduct from global Product.stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        // Record stock movement ledger: ORDER_FULFILLED
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: whId,
            type: 'ORDER_FULFILLED',
            quantity: -item.quantity,
            unitCost: stock?.avgCost || 0,
            totalCost: (stock?.avgCost || 0) * item.quantity,
            reference: order.orderNumber,
            orderId: order.id,
            notes: `Fulfilled and dispatched ${item.quantity} units for order ${order.orderNumber}`,
          },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'DELIVERED',
          reservationExpiresAt: null,
          actualDelivery: new Date(),
        },
      });

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      message: 'Order fulfilled and warehouse stock deducted',
      data: result,
    });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
