export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// POST /api/admin/warehouses/[id]/zones - Create zone in warehouse
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const { code, name, type = 'STORAGE', tempControlled = false, minTemp, maxTemp } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Zone code and name are required' }, { status: 400 });
    }

    const zone = await prisma.warehouseZone.create({
      data: {
        warehouseId: params.id,
        code: code.toUpperCase(),
        name,
        type,
        tempControlled: Boolean(tempControlled),
        minTemp: minTemp ? Number(minTemp) : null,
        maxTemp: maxTemp ? Number(maxTemp) : null,
      },
    });

    return NextResponse.json({ success: true, data: zone }, { status: 201 });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
