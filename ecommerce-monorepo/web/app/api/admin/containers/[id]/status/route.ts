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

// POST /api/admin/containers/[id]/status - Update container status
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { status } = body;

    const VALID_STATUSES = [
      'PLANNING',
      'LOADING',
      'DEPARTED',
      'IN_TRANSIT',
      'AT_CUSTOMS',
      'ARRIVED',
      'DELIVERED',
      'CANCELLED',
    ];

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const container = await prisma.container.findUnique({
      where: { id: params.id },
      include: { orders: true, purchaseOrders: true },
    });

    if (!container) return NextResponse.json({ error: 'Container not found' }, { status: 404 });

    const updated = await prisma.container.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'DEPARTED' && !container.departureDate && { departureDate: new Date() }),
        ...(status === 'DELIVERED' && !container.arrivalDate && { arrivalDate: new Date() }),
      },
    });

    // Synchronize loaded orders status if delivered or in transit
    if (status === 'DELIVERED') {
      await prisma.order.updateMany({
        where: { containerId: params.id },
        data: { status: 'DELIVERED', actualDelivery: new Date() },
      });
    } else if (status === 'DEPARTED' || status === 'IN_TRANSIT') {
      await prisma.order.updateMany({
        where: { containerId: params.id },
        data: { status: 'SHIPPED', shippedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating container status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update status' }, { status: 500 });
  }
}
