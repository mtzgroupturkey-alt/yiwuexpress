export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// GET /api/admin/stock-transfers - List stock transfers
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: {
        sourceWarehouse: { select: { id: true, name: true, code: true } },
        destinationWarehouse: { select: { id: true, name: true, code: true } },
        container: { select: { id: true, containerNumber: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: transfers });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}

// POST /api/admin/stock-transfers - Create transfer
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const { sourceWarehouseId, destinationWarehouseId, containerId, notes, items = [] } = body;

    if (!sourceWarehouseId || !destinationWarehouseId) {
      return NextResponse.json(
        { error: 'Source and destination warehouses are required' },
        { status: 400 }
      );
    }

    if (sourceWarehouseId === destinationWarehouseId) {
      return NextResponse.json(
        { error: 'Source and destination warehouses cannot be the same' },
        { status: 400 }
      );
    }

    const count = await prisma.stockTransfer.count();
    const transferNumber = `TR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNumber,
        sourceWarehouseId,
        destinationWarehouseId,
        containerId: containerId || null,
        status: 'DRAFT',
        requestedBy: admin.name || admin.email,
        notes: notes || null,
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            requestedQty: Number(i.quantity) || 1,
            unitCost: Number(i.unitCost) || 0,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, data: transfer }, { status: 201 });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
