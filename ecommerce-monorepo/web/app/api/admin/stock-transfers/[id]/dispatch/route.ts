export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// POST /api/admin/stock-transfers/[id]/dispatch - Deduct source warehouse stock and mark IN_TRANSIT
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

    if (transfer.status !== 'DRAFT' && transfer.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: 'Transfer is not in a dispatchable state' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        const stock = await tx.warehouseStock.findFirst({
          where: { warehouseId: transfer.sourceWarehouseId, productId: item.productId },
        });

        const available = (stock?.quantity || 0) - (stock?.reservedQty || 0);
        if (available < item.requestedQty) {
          throw new Error(
            `Insufficient stock at source warehouse for product ${item.productId}. Available: ${available}, Requested: ${item.requestedQty}`
          );
        }

        await tx.warehouseStock.update({
          where: { id: stock!.id },
          data: { quantity: { decrement: item.requestedQty } },
        });

        await tx.stockTransferItem.update({
          where: { id: item.id },
          data: { shippedQty: item.requestedQty },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.sourceWarehouseId,
            type: 'TRANSFER_OUT',
            quantity: -item.requestedQty,
            unitCost: stock?.avgCost || item.unitCost,
            totalCost: (stock?.avgCost || item.unitCost) * item.requestedQty,
            reference: transfer.transferNumber,
            transferId: transfer.id,
            notes: `Dispatched ${item.requestedQty} units for transfer ${transfer.transferNumber}`,
          },
        });
      }

      return await tx.stockTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'IN_TRANSIT',
          shippedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
