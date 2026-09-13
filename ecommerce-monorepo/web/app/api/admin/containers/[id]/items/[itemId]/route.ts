export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// DELETE /api/admin/containers/[id]/items/[itemId] - Remove item from container
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const item = await prisma.containerItem.findUnique({
      where: { id: params.itemId },
      include: { container: true },
    });

    if (!item || item.containerId !== params.id) {
      return NextResponse.json({ error: 'Container item not found' }, { status: 404 });
    }

    if (item.container.status === 'WAREHOUSE_RECEIVED') {
      return NextResponse.json(
        { error: 'Cannot remove item from an already received container' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // If was loaded from warehouse, restore stock & log adjustment
      if (item.source === 'WAREHOUSE' && item.sourceWarehouseId) {
        const stock = await tx.warehouseStock.findFirst({
          where: { warehouseId: item.sourceWarehouseId, productId: item.productId },
        });

        if (stock) {
          await tx.warehouseStock.update({
            where: { id: stock.id },
            data: { quantity: { increment: item.quantity } },
          });
        }

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: item.sourceWarehouseId,
            type: 'ADJUSTMENT',
            quantity: item.quantity,
            reference: item.container.containerNumber,
            containerId: item.container.id,
            notes: `Restored ${item.quantity} units from removed container item ${item.container.containerNumber}`,
          },
        });
      }

      await tx.containerItem.delete({ where: { id: params.itemId } });
    });

    return NextResponse.json({ success: true, message: 'Item removed from container' });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
