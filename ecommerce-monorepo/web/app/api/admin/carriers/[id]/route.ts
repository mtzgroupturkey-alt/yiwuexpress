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

// GET /api/admin/carriers/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const carrier = await prisma.carrier.findUnique({
      where: { id: params.id },
      include: {
        containers: {
          select: { id: true, containerNumber: true, status: true, routeType: true },
        },
      },
    });

    if (!carrier) return NextResponse.json({ error: 'Carrier not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: carrier });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching carrier' }, { status: 500 });
  }
}

// PUT /api/admin/carriers/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, code, isActive } = body;

    const carrier = await prisma.carrier.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase().trim() }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, data: carrier });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Carrier code already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Error updating carrier' }, { status: 500 });
  }
}

// DELETE /api/admin/carriers/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.carrier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Carrier deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting carrier' }, { status: 500 });
  }
}
