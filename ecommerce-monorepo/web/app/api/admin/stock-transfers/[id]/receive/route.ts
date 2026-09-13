export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// POST /api/admin/stock-transfers/[id]/receive - Receive transferred goods into destination warehouse
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (transfer.status !== 'IN_TRANSIT') {
      return NextResponse.json({ error: 'Transfer is not in transit' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        const qtyToReceive = item.shippedQty || item.requestedQty;

        const existingStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: transfer.destinationWarehouseId, productId: item.productId },
        });

        if (existingStock) {
          await tx.warehouseStock.update({
            where: { id: existingStock.id },
            data: { quantity: { increment: qtyToReceive } },
          });
        } else {
          await tx.warehouseStock.create({
            data: {
              warehouseId: transfer.destinationWarehouseId,
              productId: item.productId,
              quantity: qtyToReceive,
              reservedQty: 0,
              avgCost: item.unitCost,
            },
          });
        }

        await tx.stockTransferItem.update({
          where: { id: item.id },
          data: { receivedQty: qtyToReceive },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.destinationWarehouseId,
            type: 'TRANSFER_IN',
            quantity: qtyToReceive,
            unitCost: item.unitCost,
            totalCost: item.unitCost * qtyToReceive,
            reference: transfer.transferNumber,
            transferId: transfer.id,
            notes: `Received ${qtyToReceive} units from transfer ${transfer.transferNumber}`,
          },
        });
      }

      return await tx.stockTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'COMPLETED',
          receivedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
