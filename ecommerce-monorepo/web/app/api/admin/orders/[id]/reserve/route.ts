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

    // Default to Belarus Minsk DC for fulfillment reservation
    let whId: string | null = order.warehouseId || null;
    if (!whId) {
      const defaultSalesWh = await prisma.warehouse.findFirst({
        where: { isDefaultSales: true },
      });
      whId = defaultSalesWh?.id || null;
    }

    if (!whId) {
      return NextResponse.json(
        { error: 'Sales warehouse (Belarus DC) could not be located' },
        { status: 400 }
      );
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const result = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const stock = await tx.warehouseStock.findFirst({
          where: { warehouseId: whId, productId: item.productId },
        });

        const available = (stock?.quantity || 0) - (stock?.reservedQty || 0);
        if (available < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.productName}. Available: ${available}, Required: ${item.quantity}`
          );
        }

        // Increment reservedQty
        await tx.warehouseStock.update({
          where: { id: stock!.id },
          data: { reservedQty: { increment: item.quantity } },
        });

        // Record stock movement ledger: ORDER_RESERVED
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: whId,
            type: 'ORDER_RESERVED',
            quantity: item.quantity,
            reference: order.orderNumber,
            orderId: order.id,
            notes: `Reserved ${item.quantity} units for 24 hours for order ${order.orderNumber}`,
          },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          warehouseId: whId,
          reservationExpiresAt: expiresAt,
        },
      });

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      message: 'Order stock reserved for 24 hours',
      data: result,
    });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
