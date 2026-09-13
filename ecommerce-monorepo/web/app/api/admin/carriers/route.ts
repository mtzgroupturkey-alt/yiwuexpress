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

// GET /api/admin/carriers - List carriers
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const carriers = await prisma.carrier.findMany({
      include: {
        _count: {
          select: { containers: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: carriers });
  } catch (error: any) {
    console.error('Error fetching carriers:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch carriers' }, { status: 500 });
  }
}

// POST /api/admin/carriers - Create carrier
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, code, isActive = true } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Carrier name and code are required' }, { status: 400 });
    }

    const carrier = await prisma.carrier.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, data: carrier }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Carrier code already exists' }, { status: 400 });
    }
    console.error('Error creating carrier:', error);
    return NextResponse.json({ error: error.message || 'Failed to create carrier' }, { status: 500 });
  }
}
