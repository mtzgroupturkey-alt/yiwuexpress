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

// GET /api/admin/agents/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        containers: {
          select: { id: true, containerNumber: true, status: true, routeType: true },
        },
      },
    });

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: agent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching agent' }, { status: 500 });
  }
}

// PUT /api/admin/agents/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, email, phone, company, isActive } = body;

    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, data: agent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating agent' }, { status: 500 });
  }
}

// DELETE /api/admin/agents/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.agent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Agent deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting agent' }, { status: 500 });
  }
}
