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

// POST /api/admin/containers/[id]/remove-po - Unload Purchase Order from Container
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { purchaseOrderId } = await req.json();
    if (!purchaseOrderId) return NextResponse.json({ error: 'purchaseOrderId required' }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { containerId: null },
      });

      // Remove items that were automatically populated from this PO
      await tx.containerItem.deleteMany({
        where: {
          containerId: params.id,
          sourcePoId: purchaseOrderId,
        },
      });

      return po;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error removing PO' }, { status: 500 });
  }
}
