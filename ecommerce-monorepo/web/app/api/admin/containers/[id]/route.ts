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

// GET /api/admin/containers/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const container = await prisma.container.findUnique({
      where: { id: params.id },
      include: {
        carrier: true,
        agent: true,
        costItems: { orderBy: { createdAt: 'desc' } },
        agentPayments: {
          include: { agent: { select: { id: true, name: true, email: true, phone: true } } },
          orderBy: { paymentDate: 'desc' },
        },
        purchaseOrders: {
          include: { supplier: { select: { id: true, name: true } } },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
                        user: { select: { name: true, email: true } },
          },
        },
        routes: { orderBy: { legOrder: 'asc' } },
      },
    });

    if (!container) return NextResponse.json({ error: 'Container not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: container });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/containers/[id] - Update container basic info
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      containerNumber,
      carrierId,
      agentId,
      routeType,
      origin,
      destination,
      departureDate,
      arrivalDate,
      status,
      notes,
    } = body;

    const data: any = {};
    if (containerNumber !== undefined) data.containerNumber = containerNumber;
    if (carrierId !== undefined) data.carrierId = carrierId || null;
    if (agentId !== undefined) data.agentId = agentId || null;
    if (routeType !== undefined) data.routeType = routeType;
    if (origin !== undefined) data.origin = origin;
    if (destination !== undefined) data.destination = destination;
    if (departureDate !== undefined) data.departureDate = departureDate ? new Date(departureDate) : null;
    if (arrivalDate !== undefined) data.arrivalDate = arrivalDate ? new Date(arrivalDate) : null;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.container.update({
      where: { id: params.id },
      data,
      include: {
        carrier: true,
        agent: true,
        costItems: true,
        agentPayments: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/containers/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Unassign POs and Orders before deleting container
    await prisma.purchaseOrder.updateMany({
      where: { containerId: params.id },
      data: { containerId: null },
    });

    await prisma.order.updateMany({
      where: { containerId: params.id },
      data: { containerId: null },
    });

    await prisma.container.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Container deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
