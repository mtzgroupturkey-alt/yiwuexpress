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

// GET /api/admin/containers/[id]/available-pos
// Returns unassigned POs annotated with compatibility for the container's loadingType
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const container = await prisma.container.findUnique({
      where: { id: params.id },
      select: { id: true, containerNumber: true, loadingType: true },
    });

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    // Fetch all unassigned purchase orders (exclude already received into warehouse)
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        containerId: null,
        status: { notIn: ['RECEIVED', 'CANCELLED'] },
      },
      include: {
        supplier: {
          select: { id: true, name: true, companyName: true },
        },
        targetCustomer: {
          select: { id: true, name: true, email: true, companyName: true },
        },
        linkedOrder: {
          select: { id: true, orderNumber: true, status: true, total: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, costPrice: true, price: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const annotated = purchaseOrders.map((po) => {
      // All unassigned purchase orders are eligible to be loaded into container
      let sourceType = 'Direct Factory PO';
      if (po.purchaseDestination === 'CHINA_WAREHOUSE') {
        sourceType = 'Warehouse Stock / Consolidate';
      } else if (po.purchaseDestination === 'DIRECT_TO_CUSTOMER') {
        sourceType = 'Direct to Customer';
      }

      return {
        ...po,
        isCompatible: true,
        sourceType,
        compatibilityReason: '',
      };
    });

    return NextResponse.json({
      success: true,
      containerLoadingType: container.loadingType,
      data: annotated,
      purchaseOrders: annotated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
