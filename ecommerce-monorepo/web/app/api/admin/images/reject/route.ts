export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId is required' }, { status: 400 });
    }

    const candidate = await prisma.imageSearchCandidate.update({
      where: { id: candidateId },
      data: {
        status: 'REJECTED',
        reviewedBy: admin.email,
        reviewedAt: new Date(),
      },
    });

    await prisma.imageSearchLog.create({
      data: {
        productId: candidate.productId,
        candidateId,
        source: candidate.source,
        action: 'reject',
        adminUser: admin.email,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
    }).catch(() => null);

    return NextResponse.json({ success: true, candidateId });
  } catch (error: any) {
    console.error('[RejectCandidate API Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to reject candidate' }, { status: 500 });
  }
}
