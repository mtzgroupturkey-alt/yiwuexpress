export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { autoFetchIkeaProductPhoto } from '@/lib/storage/auto-ikea-photo';

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
    const body = await request.json().catch(() => ({}));
    const { limit = 20, productIds } = body;

    let targetProductIds: string[] = [];

    if (Array.isArray(productIds) && productIds.length > 0) {
      targetProductIds = productIds;
    } else {
      // Find products marked without real images or with placeholder
      const placeholderProducts = await prisma.product.findMany({
        where: {
          OR: [
            { hasRealImage: false },
            { thumbnail: null },
            { thumbnail: { contains: 'placeholder' } },
          ],
        },
        select: { id: true },
        take: Math.min(100, Math.max(1, limit)),
      });
      targetProductIds = placeholderProducts.map((p) => p.id);
    }

    if (targetProductIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No placeholder products needing update.',
        updated: 0,
        results: [],
      });
    }

    const results = [];
    let updatedCount = 0;

    // Process sequentially or with slight concurrency to be polite to external CDN
    for (const id of targetProductIds) {
      const res = await autoFetchIkeaProductPhoto(id);
      results.push(res);
      if (res.success) {
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      total: targetProductIds.length,
      updated: updatedCount,
      results,
    });
  } catch (error: any) {
    console.error('[AutoFetchIkeaBatch API Error]:', error);
    return NextResponse.json({ error: error.message || 'Batch update failed' }, { status: 500 });
  }
}
