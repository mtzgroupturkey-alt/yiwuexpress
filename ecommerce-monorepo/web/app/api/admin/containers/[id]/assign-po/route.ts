export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

async function checkAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });
  return user?.role === 'ADMIN' ? user : null;
}

// POST /api/admin/containers/[id]/assign-po - Load Purchase Order into Container
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { purchaseOrderId } = await req.json();
    if (!purchaseOrderId) return NextResponse.json({ error: 'purchaseOrderId required' }, { status: 400 });

    const existingPo = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        targetCustomer: true,
        linkedOrder: true,
      },
    });

    if (!existingPo) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const container = await prisma.container.findUnique({
      where: { id: params.id },
      select: { id: true, sourceWarehouseId: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { containerId: params.id },
        include: { supplier: true, items: true, targetCustomer: true, linkedOrder: true },
      });

      // Synchronize PO items into container_items so landed costs & cargo items are tracked
      for (const item of existingPo.items) {
        if (!item.productId) continue;
        const qty = item.quantity || 1;
        const unitCost = item.unitPrice || item.product?.costPrice || 0;
        const totalCost = (item as any).totalPrice || (item as any).totalAmount || (unitCost * qty);
        const weight = (item.product?.weightKg || 1) * qty;
        const cbm = ((item.product as any)?.cbm || 0.01) * qty;

        const existingItem = await tx.containerItem.findFirst({
          where: {
            containerId: params.id,
            sourcePoId: existingPo.id,
            productId: item.productId,
          },
        });

        if (!existingItem) {
          await tx.containerItem.create({
            data: {
              containerId: params.id,
              productId: item.productId,
              quantity: qty,
              unitCost,
              totalCost,
              weight,
              cbm,
              source: 'PO',
              sourcePoId: existingPo.id,
              sourceWarehouseId: container?.sourceWarehouseId || null,
              allocatedCost: 0,
              landedCostPerUnit: unitCost,
            },
          });
        }
      }

      return po;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error assigning PO' }, { status: 500 });
  }
}
