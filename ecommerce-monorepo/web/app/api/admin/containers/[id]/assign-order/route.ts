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

// POST /api/admin/containers/[id]/assign-order - Load Customer Order into Container
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const container = await prisma.container.findUnique({ where: { id: params.id } });
    if (!container) return NextResponse.json({ error: 'Container not found' }, { status: 404 });

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        containerId: params.id,
        status: orderId && container.status === 'DEPARTED' ? 'SHIPPED' : 'PROCESSING',
      },
      include: { user: true, items: true },
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error assigning order' }, { status: 500 });
  }
}
