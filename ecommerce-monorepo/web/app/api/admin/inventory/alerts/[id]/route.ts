export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// PATCH /api/admin/inventory/alerts/[id] - Update status (RESOLVED, IGNORED)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);
    const body = await request.json();
    const { status } = body;

    const alert = await prisma.lowStockAlert.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ success: true, data: alert });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}

// DELETE /api/admin/inventory/alerts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);
    await prisma.lowStockAlert.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: 'Alert deleted' });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
