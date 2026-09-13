export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// GET /api/admin/returns-to-supplier - List supplier returns
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const searchParams = request.nextUrl.searchParams;
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');

    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    const returns = await prisma.returnToSupplier.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, companyName: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: returns });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}

// POST /api/admin/returns-to-supplier - Create return & deduct defective/excess stock from China DC
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const {
      supplierId,
      warehouseId,
      purchaseOrderId,
      reason,
      refundMethod = 'STORE_CREDIT',
      notes,
      items = [],
    } = body;

    if (!supplierId || !reason || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier, reason, and at least one item are required' },
        { status: 400 }
      );
    }

    // Default to China DC for returns
    let whId = warehouseId;
    if (!whId) {
      const cnWh = await prisma.warehouse.findFirst({ where: { isDefaultProcurement: true } });
      whId = cnWh?.id;
    }

    if (!whId) {
      return NextResponse.json({ error: 'Warehouse could not be determined' }, { status: 400 });
    }

    const count = await prisma.returnToSupplier.count();
    const returnNumber = `RTS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const itemsToCreate = [];

      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || 0;
        const lineTotal = qty * price;
        totalAmount += lineTotal;

        itemsToCreate.push({
          productId: item.productId,
          quantity: qty,
          unitPrice: price,
          totalAmount: lineTotal,
          reason: item.reason || reason,
        });

        // Deduct from warehouse stock
        const stock = await tx.warehouseStock.findFirst({
          where: { warehouseId: whId, productId: item.productId },
        });

        if (stock) {
          await tx.warehouseStock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: qty } },
          });
        }

        // Deduct from global Product.stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: qty } },
        });

        // Record stock movement ledger: SUPPLIER_RETURN
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: whId,
            type: 'SUPPLIER_RETURN',
            quantity: -qty,
            unitCost: price,
            totalCost: lineTotal,
            reference: returnNumber,
            notes: `Returned ${qty} units to supplier: ${reason}`,
          },
        });
      }

      const rts = await tx.returnToSupplier.create({
        data: {
          returnNumber,
          supplierId,
          warehouseId: whId,
          purchaseOrderId: purchaseOrderId || null,
          status: 'APPROVED',
          totalAmount,
          reason,
          refundMethod,
          notes: notes || null,
          items: { create: itemsToCreate },
        },
        include: { items: true },
      });

      return rts;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
