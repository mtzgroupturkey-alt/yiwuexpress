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
      select: { id: true, poNumber: true, purchaseDestination: true },
    });

    if (!existingPo) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    if (existingPo.purchaseDestination === 'CHINA_WAREHOUSE') {
      return NextResponse.json(
        { error: `PO ${existingPo.poNumber} is destined for China warehouse and cannot be loaded directly into a container.` },
        { status: 400 }
      );
    }

    const po = await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { containerId: params.id },
      include: { supplier: true, items: true, targetCustomer: true, linkedOrder: true },
    });

    return NextResponse.json({ success: true, data: po });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error assigning PO' }, { status: 500 });
  }
}
