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

    const results: any[] = [];
    let updatedCount = 0;

    // Process in polite concurrent chunks of 3 for fast execution without CDN rate-limiting
    const CHUNK_SIZE = 3;
    for (let i = 0; i < targetProductIds.length; i += CHUNK_SIZE) {
      const chunk = targetProductIds.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.allSettled(
        chunk.map((id) => autoFetchIkeaProductPhoto(id))
      );

      for (let j = 0; j < chunkResults.length; j++) {
        const itemResult = chunkResults[j];
        if (itemResult.status === 'fulfilled') {
          results.push(itemResult.value);
          if (itemResult.value.success) {
            updatedCount++;
          }
        } else {
          results.push({
            success: false,
            productId: chunk[j],
            name: '',
            isReal: false,
            previousWasPlaceholder: true,
            error: itemResult.reason?.message || 'Processing error',
          });
        }
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
